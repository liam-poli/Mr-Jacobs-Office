import { corsHeaders } from "../_shared/cors.ts";
import { generateJacobsReview } from "../_shared/jacobsReviewAI.ts";
import { checkRateLimit, RATE_LIMITS } from "../_shared/rateLimit.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { events, job, current_mood, world_state } = await req.json();

    if (!job || !current_mood) {
      return new Response(
        JSON.stringify({ error: "job and current_mood are required" }),
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
      `jacobs-review:${clientIp}`,
      RATE_LIMITS.jacobsReview,
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
      `jacobs-review: processing ${(events || []).length} events, job=${job.title}, mood=${current_mood}`,
    );

    const review = await generateJacobsReview(
      events || [],
      job,
      current_mood,
      world_state ?? {},
    );

    console.log("Jacobs review:", review);

    return new Response(JSON.stringify(review), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("jacobs-review error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
