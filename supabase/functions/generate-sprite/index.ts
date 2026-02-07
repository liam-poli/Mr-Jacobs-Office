import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "../_shared/cors.ts";
import { generateSprite, removeBackground } from "../_shared/replicate.ts";

function buildItemPrompt(name: string, tags: string[]): string {
  const tagList = tags.length > 0 ? tags.join(", ") : "generic";
  return (
    `A single ${name}, small handheld item, pixel art sprite, 16-bit retro game style, ` +
    `3/4 front-facing view with slight overhead angle like a classic 16-bit RPG inventory icon, crisp 1-pixel edges, no blur or anti-aliasing, ` +
    `muted desaturated office palette (warm beige, ivory, taupe, charcoal, steel gray), ` +
    `no greens or teals, avoid saturated colors, minimal highlights, ` +
    `clean simple silhouette, centered on a plain white background, ` +
    `no shadows, no text, no extra objects. ` +
    `Properties: ${tagList}.`
  );
}

function buildObjectPrompt(name: string, tags: string[], state?: string): string {
  const tagList = tags.length > 0 ? tags.join(", ") : "generic";
  const stateHint = state ? ` Currently ${state.toLowerCase()}.` : "";
  return (
    `A single ${name}, office furniture or fixture, pixel art sprite, 16-bit retro game style, ` +
    `3/4 front-facing view with slight overhead angle showing the front face and a bit of the top like a classic 16-bit RPG, ` +
    `crisp 1-pixel edges, no blur or anti-aliasing, ` +
    `muted desaturated office palette (warm beige, ivory, taupe, charcoal, steel gray), ` +
    `no greens or teals, avoid saturated colors, minimal highlights, ` +
    `detailed enough to be recognizable at 32-64px in-game, ` +
    `centered on a plain white background, ` +
    `no shadows, no text, no extra objects, no people. ` +
    `Properties: ${tagList}.${stateHint}`
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, id, name, tags, state } = await req.json();

    if (!type || !id || !name) {
      return new Response(
        JSON.stringify({ error: "type, id, and name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Build prompt + pick size
    const prompt = type === "object"
      ? buildObjectPrompt(name, tags ?? [], state)
      : buildItemPrompt(name, tags ?? []);
    const size = type === "object" ? 512 : 256;
    console.log(`Generating ${type} sprite (${size}px) with prompt:`, prompt);

    // 2. Generate sprite via Flux
    const rawImageUrl = await generateSprite(prompt, size);
    console.log("Raw image generated:", rawImageUrl);

    // 3. Remove background via rembg
    const transparentPng = await removeBackground(rawImageUrl);
    console.log("Background removed, size:", transparentPng.byteLength);

    // 4. Upload to Supabase Storage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const filePath = `${type}/${id}.png`;
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
    const table = type === "item" ? "items" : "objects";
    const { error: updateError } = await supabase
      .from(table)
      .update({ sprite_url: spriteUrl })
      .eq("id", id);

    if (updateError) throw updateError;

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
