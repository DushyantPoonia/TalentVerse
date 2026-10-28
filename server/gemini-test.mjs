import "dotenv/config";

const key = process.env.LLM_API_KEY;
const base = (process.env.LLM_BASE_URL || "").replace(/\/+$/, "");
const model = process.env.LLM_MODEL;

if (!key || !base || !model) {
  console.log("Missing LLM_API_KEY, LLM_BASE_URL, or LLM_MODEL in server/.env");
  process.exit(1);
}

const started = Date.now();

try {
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    signal: AbortSignal.timeout(30000),
    body: JSON.stringify({
      model,
      reasoning_effort: "low",
      messages: [{ role: "user", content: "Reply with exactly: OK" }]
    })
  });

  const body = await response.text();
  console.log("HTTP:", response.status);
  console.log("Elapsed:", Date.now() - started, "ms");
  console.log("Content-Type:", response.headers.get("content-type"));
  console.log("Retry-After:", response.headers.get("retry-after"));
  console.log("Response body:", body.slice(0, 1000));
  console.log("HTTP:", response.status);
  console.log("Elapsed:", Date.now() - started, "ms");

  try {
    const data = JSON.parse(body);
    console.log("Provider message:", data.error?.message || "No provider error");
    console.log("Model reply:", data.choices?.[0]?.message?.content || "(none)");
  } catch {
    console.log("Response was not JSON. Body length:", body.length);
  }
} catch (error) {
  console.log("Request failed:", error.name);
  console.log("Elapsed:", Date.now() - started, "ms");
}
