import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "../_shared/cors.ts";
import { generateSprite, removeBackground, type SpriteModel } from "../_shared/replicate.ts";

const DIRECTION_PROMPTS: Record<string, string> = {
  down: "front-facing view, the object faces the viewer head-on",
  up: "rear view from behind, showing the back of the object",
  left: "side profile view facing left",
  right: "side profile view facing right",
};

function buildItemPrompt(name: string, tags: string[]): string {
  const tagList = tags.length > 0 ? tags.join(", ") : "generic";
  return (
    `A single ${name}, small handheld item, 2D pixel art sprite for a retro 16-bit video game, ` +
    `front-facing view looking straight at the object, shown as a 2D sprite sheet asset, ` +
    `crisp 1-pixel edges, no blur or anti-aliasing, ` +
    `natural colors appropriate to the object, retro 16-bit palette, 1980s office aesthetic, ` +
    `detailed enough to be recognizable at 32px in-game, clean simple silhouette, ` +
    `centered on a plain white background, ` +
    `plain unmarked surface, no shadows, no extra objects, no people, no floor, no ground. ` +
    `Properties: ${tagList}.`
  );
}

function buildObjectPrompt(name: string, tags: string[], state?: string, direction?: string): string {
  const tagList = tags.length > 0 ? tags.join(", ") : "generic";
  const stateHint = state ? ` Currently ${state.toLowerCase()}.` : "";
  const viewHint = DIRECTION_PROMPTS[direction ?? "down"] ?? DIRECTION_PROMPTS["down"];
  return (
    `A single ${name}, 2D pixel art sprite for a retro 16-bit top-down video game, ` +
    `flat orthographic ${viewHint}, perfectly straight-on, zero perspective, zero rotation, no 3D, no isometric, ` +
    `the object is shown as a 2D sprite sheet asset, ` +
    `crisp 1-pixel edges, no blur or anti-aliasing, ` +
    `natural colors appropriate to the object, retro 16-bit palette, 1980s office aesthetic, ` +
    `detailed enough to be recognizable at 32-64px in-game, ` +
    `centered on a plain white background, ` +
    `plain unmarked surface, no shadows, no extra objects, no people, no floor, no ground. ` +
    `Properties: ${tagList}.${stateHint}`
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, id, name, tags, state, model, direction } = await req.json();
    // Items default to Klein (fast/cheap), objects default to Pro (higher quality)
    const defaultModel: SpriteModel = type === "item" ? "flux-2-klein" : "flux-2-pro";
    const validModels: SpriteModel[] = ["flux-2-pro", "flux-2-klein", "nano-banana-pro"];
    const spriteModel: SpriteModel = validModels.includes(model) ? model : defaultModel;

    if (!type || !id || !name) {
      return new Response(
        JSON.stringify({ error: "type, id, and name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Build prompt + pick size
    const prompt = type === "object"
      ? buildObjectPrompt(name, tags ?? [], state, direction)
      : buildItemPrompt(name, tags ?? []);
    const size = type === "object" ? 512 : 256;
    console.log(`Generating ${type} sprite (${size}px, dir=${direction ?? "down"}) via ${spriteModel} with prompt:`, prompt);

    // 2. Generate sprite via selected model
    const rawImageUrl = await generateSprite(prompt, size, spriteModel);
    console.log("Raw image generated:", rawImageUrl);

    // 3. Remove background via rembg
    const transparentPng = await removeBackground(rawImageUrl);
    console.log("Background removed, size:", transparentPng.byteLength);

    // 4. Upload to Supabase Storage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const dirSuffix = direction && direction !== "down" ? `-${direction}` : "";
    const filePath = `${type}/${id}${dirSuffix}.png`;
    const { error: uploadError } = await supabase.storage
      .from("sprites")
      .upload(filePath, transparentPng, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 5. Get public URL with cache-bust
    const { data: urlData } = supabase.storage
      .from("sprites")
      .getPublicUrl(filePath);

    const spriteUrl = `${urlData.publicUrl}?v=${Date.now()}`;

    // 6. Update the DB row
    if (type === "object" && direction) {
      // Merge into directional_sprites JSONB
      const { data: current } = await supabase
        .from("objects")
        .select("directional_sprites")
        .eq("id", id)
        .single();

      const existing = (current?.directional_sprites as Record<string, string>) ?? {};
      existing[direction] = spriteUrl;

      const updatePayload: Record<string, unknown> = {
        directional_sprites: existing,
      };
      // Also update sprite_url if this is the default (down) direction
      if (direction === "down") {
        updatePayload.sprite_url = spriteUrl;
      }

      const { error: updateError } = await supabase
        .from("objects")
        .update(updatePayload)
        .eq("id", id);

      if (updateError) throw updateError;
    } else {
      // Items or objects without direction: just update sprite_url
      const table = type === "item" ? "items" : "objects";
      const { error: updateError } = await supabase
        .from(table)
        .update({ sprite_url: spriteUrl })
        .eq("id", id);

      if (updateError) throw updateError;
    }

    console.log("Sprite saved:", spriteUrl);

    return new Response(
      JSON.stringify({ sprite_url: spriteUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("generate-sprite error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
