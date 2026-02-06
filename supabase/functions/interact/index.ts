import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "../_shared/cors.ts";
import { resolveInteraction } from "../_shared/interactionAI.ts";
import { checkRateLimit, RATE_LIMITS } from "../_shared/rateLimit.ts";

/** Build deterministic hash from sorted tags + state */
function buildInputHash(
  itemTags: string[],
  objectTags: string[],
  objectState: string | null,
): string {
  const sortedItem = [...itemTags].sort();
  const sortedObject = [...objectTags].sort();
  return `${sortedItem.join("+")}|${sortedObject.join("+")}|${objectState ?? "ANY"}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { item_tags, object_tags, object_state, item_name, object_name } =
      await req.json();

    if (!item_tags || !object_tags || !item_name || !object_name) {
      return new Response(
        JSON.stringify({
          error: "item_tags, object_tags, item_name, and object_name are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Build hash
    const inputHash = buildInputHash(
      item_tags,
      object_tags,
      object_state ?? null,
    );
    console.log("Input hash:", inputHash);

    // 2. Cache lookup
    const { data: cached } = await supabase
      .from("interactions")
      .select("*")
      .eq("input_hash", inputHash)
      .single();

    if (cached) {
      console.log("Cache hit:", cached.id);
      return new Response(
        JSON.stringify({
          result_state: cached.result_state,
          output_item: cached.output_item,
          output_item_tags: cached.output_item_tags,
          description: cached.description,
          cached: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 3. Cache miss — rate limit before calling AI
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rateLimit = checkRateLimit(
      `interact:${clientIp}`,
      RATE_LIMITS.interact,
    );

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please slow down.",
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(
              Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }

    // 4. Call AI
    console.log("Cache miss — calling AI for:", item_name, "on", object_name);
    const aiResult = await resolveInteraction(
      item_tags,
      object_tags,
      object_state ?? "UNLOCKED",
      item_name,
      object_name,
    );
    console.log("AI result:", aiResult);

    // 5. Insert into cache
    const { error: insertError } = await supabase.from("interactions").insert({
      input_hash: inputHash,
      item_tags: [...item_tags].sort(),
      object_tags: [...object_tags].sort(),
      required_state: object_state ?? null,
      result_state: aiResult.result_state,
      output_item: aiResult.output_item,
      output_item_tags: aiResult.output_item_tags ?? [],
      description: aiResult.description,
      source: "ai",
    });

    // 6. Handle race condition (another request cached it first)
    if (insertError?.code === "23505") {
      console.log("Race condition — fetching winning row");
      const { data: existing } = await supabase
        .from("interactions")
        .select("*")
        .eq("input_hash", inputHash)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({
            result_state: existing.result_state,
            output_item: existing.output_item,
            output_item_tags: existing.output_item_tags,
            description: existing.description,
            cached: true,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    if (insertError && insertError.code !== "23505") {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        result_state: aiResult.result_state,
        output_item: aiResult.output_item,
        output_item_tags: aiResult.output_item_tags,
        description: aiResult.description,
        cached: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("interact error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
