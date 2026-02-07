const REPLICATE_MODELS_URL = "https://api.replicate.com/v1/models";
const REPLICATE_PREDICTIONS_URL = "https://api.replicate.com/v1/predictions";

export type SpriteModel = "flux-2-pro" | "nano-banana-pro";

function getToken(): string {
  const token = Deno.env.get("REPLICATE_API_TOKEN");
  if (!token) throw new Error("REPLICATE_API_TOKEN not set");
  return token;
}

async function waitForPrediction(
  predictionUrl: string,
  token: string,
): Promise<unknown> {
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(predictionUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.status === "succeeded") return data.output;
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Replicate prediction ${data.status}: ${data.error}`);
    }
  }
  throw new Error("Replicate prediction timed out");
}

function buildFluxInput(prompt: string, size: number) {
  return {
    url: `${REPLICATE_MODELS_URL}/black-forest-labs/flux-2-pro/predictions`,
    input: {
      prompt,
      aspect_ratio: "custom",
      width: size,
      height: size,
      output_format: "png",
      safety_tolerance: 5,
    },
  };
}

function buildNanoBananaInput(prompt: string) {
  return {
    url: `${REPLICATE_MODELS_URL}/google/nano-banana-pro/predictions`,
    input: {
      prompt,
      aspect_ratio: "1:1",
      resolution: "1024",
      output_format: "png",
      safety_filter_level: "block_low_and_above",
    },
  };
}

export async function generateSprite(
  prompt: string,
  size: number = 256,
  model: SpriteModel = "flux-2-pro",
): Promise<string> {
  const token = getToken();

  const { url, input } = model === "nano-banana-pro"
    ? buildNanoBananaInput(prompt)
    : buildFluxInput(prompt, size);

  console.log(`Using model: ${model}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });

  const prediction = await res.json();
  if (prediction.error) throw new Error(prediction.error);

  const output = await waitForPrediction(prediction.urls.get, token);
  // Both models return a single URL string
  return output as string;
}

export async function removeBackground(
  imageUrl: string,
): Promise<ArrayBuffer> {
  const token = getToken();

  const res = await fetch(REPLICATE_PREDICTIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version:
        "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
      input: { image: imageUrl },
    }),
  });

  const prediction = await res.json();
  if (prediction.error) throw new Error(prediction.error);

  const outputUrl = (await waitForPrediction(
    prediction.urls.get,
    token,
  )) as string;

  const imgRes = await fetch(outputUrl);
  return await imgRes.arrayBuffer();
}
