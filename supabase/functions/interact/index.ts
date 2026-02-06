import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "../_shared/cors.ts";
import { resolveInteraction } from "../_shared/interactionAI.ts";
import { checkRateLimit, RATE_LIMITS } from "../_shared/rateLimit.ts";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      item_id,
      object_id,
      item_tags,
      object_tags,
      object_state,
      item_name,
      object_name,
    } = await req.json();

    if (!object_id || !item_tags || !object_tags || !object_name) {
      return jsonResponse(
        { error: "object_id, item_tags, object_tags, and object_name are required" },
        400,
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Cache lookup by item_id + object_id + state
    let query = supabase
      .from("interactions")
      .select("*")
      .eq("object_id", object_id);

    if (item_id) {
      query = query.eq("item_id", item_id);
    } else {
      query = query.is("item_id", null);
    }

    const { data: matches } = await query;

    // Find best match: prefer exact state match over wildcard (required_state IS NULL)
    if (matches && matches.length > 0) {
      const exactStateMatch = matches.find(
        (m) => m.required_state === (object_state ?? null),
      );
      const wildcardMatch = matches.find((m) => m.required_state === null);
      const cached = exactStateMatch ?? wildcardMatch;

      if (cached) {
        console.log("Cache hit:", cached.id);
        return jsonResponse({
          result_state: cached.result_state,
          output_item: cached.output_item,
          output_item_tags: cached.output_item_tags,
          description: cached.description,
          cached: true,
        });
      }
    }

    // 2. Cache miss — rate limit before calling AI
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rateLimit = checkRateLimit(
      `interact:${clientIp}`,
      RATE_LIMITS.interact,
    );

    if (!rateLimit.allowed) {
      return jsonResponse(
        {
          error: "Rate limit exceeded. Please slow down.",
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        },
        429,
      );
    }

    // 3. Call AI
    console.log("Cache miss — calling AI for:", item_name, "on", object_name);
    const aiResult = await resolveInteraction(
      item_tags,
      object_tags,
      object_state ?? "UNLOCKED",
      item_name ?? "(bare hands)",
      object_name,
    );
    console.log("AI result:", aiResult);

    // 4. Cache the AI result with item_id + object_id
    const { error: insertError } = await supabase.from("interactions").insert({
      item_id: item_id ?? null,
      object_id,
      required_state: object_state ?? null,
      item_tags: [...item_tags].sort(),
      object_tags: [...object_tags].sort(),
      result_state: aiResult.result_state,
      output_item: aiResult.output_item,
      output_item_tags: aiResult.output_item_tags ?? [],
      description: aiResult.description,
      source: "ai",
    });

    if (insertError) {
      // Non-fatal — log but still return the result
      console.warn("Cache insert failed:", insertError.message);
    }

    return jsonResponse({
      result_state: aiResult.result_state,
      output_item: aiResult.output_item,
      output_item_tags: aiResult.output_item_tags,
      description: aiResult.description,
      cached: false,
    });
  } catch (err) {
    console.error("interact error:", err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
