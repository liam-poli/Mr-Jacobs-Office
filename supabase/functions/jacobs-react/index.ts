import { corsHeaders } from "../_shared/cors.ts";
import { generateJacobsReaction } from "../_shared/jacobsAI.ts";
import { checkRateLimit, RATE_LIMITS } from "../_shared/rateLimit.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { events, current_mood, world_state, current_job } = await req.json();

    if (!events || !current_mood) {
      return new Response(
        JSON.stringify({ error: "events and current_mood are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Rate limit
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rateLimit = checkRateLimit(
      `jacobs-react:${clientIp}`,
      RATE_LIMITS.jacobsReact,
    );

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded.",
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

    console.log(
      `jacobs-react: processing ${events.length} events, mood=${current_mood}`,
    );

    const reaction = await generateJacobsReaction(
      events,
      current_mood,
      world_state ?? {},
      current_job ?? null,
    );

    console.log("Jacobs reaction:", reaction);

    return new Response(JSON.stringify(reaction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("jacobs-react error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
