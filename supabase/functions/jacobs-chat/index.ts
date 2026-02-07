import { corsHeaders } from "../_shared/cors.ts";
import { generateJacobsChat } from "../_shared/jacobsChatAI.ts";
import { checkRateLimit, RATE_LIMITS } from "../_shared/rateLimit.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, history, current_mood, recent_events, current_job } = await req.json();

    if (!message || !current_mood) {
      return new Response(
        JSON.stringify({ error: "message and current_mood are required" }),
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
      `jacobs-chat:${clientIp}`,
      RATE_LIMITS.jacobsChat,
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
      `jacobs-chat: message="${message.slice(0, 50)}", mood=${current_mood}`,
    );

    const response = await generateJacobsChat(
      message,
      history ?? [],
      current_mood,
      recent_events ?? [],
      current_job ?? null,
    );

    console.log("Jacobs chat response:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("jacobs-chat error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
