export type AiProviderResult = { content: string; providerRequestId?: string; promptTokens?: number; completionTokens?: number };
export type AiProviderConfig = { apiKey: string; baseUrl: "https://api.deepseek.com"; model: "deepseek-chat" };

export function providerConfig(env: CloudflareEnv): AiProviderConfig | undefined {
  if (!env.DEEPSEEK_API_KEY) return undefined;
  const baseUrl = env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = env.DEEPSEEK_MODEL || "deepseek-chat";
  if (baseUrl !== "https://api.deepseek.com" || model !== "deepseek-chat") throw new Error("AI_PROVIDER_CONFIG_INVALID");
  return { apiKey: env.DEEPSEEK_API_KEY, baseUrl, model };
}

const transientStatus = (status: number) => status === 429 || status >= 500;
export async function callAiProvider(config: AiProviderConfig, prompt: string, maxOutputTokens: number, request: typeof fetch = fetch): Promise<AiProviderResult> {
  let response: Response | undefined;
  let finalStatus: number | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      response = await request(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: "You provide concise, grounded Chinese-language learning support. Follow the requested JSON schema exactly." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: maxOutputTokens,
          stream: false,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
      finalStatus = response.status;
      if (response.ok || !transientStatus(response.status) || attempt === 1) break;
    } catch {
      response = undefined;
      if (attempt === 1) throw new Error("AI_PROVIDER_UNAVAILABLE");
    } finally {
      clearTimeout(timeout);
    }
  }
  if (!response) throw new Error("AI_PROVIDER_UNAVAILABLE");
  if (finalStatus === 429) throw new Error("AI_PROVIDER_RATE_LIMITED");
  if (!response.ok) throw new Error("AI_PROVIDER_UNAVAILABLE");
  let value: any;
  try { value = await response.json(); } catch { throw new Error("AI_PROVIDER_INVALID_RESPONSE"); }
  const content = value?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim() || content.length > 8000) throw new Error("AI_PROVIDER_INVALID_RESPONSE");
  const usage = value?.usage ?? {};
  const promptTokens = Number.isInteger(usage.prompt_tokens) && usage.prompt_tokens >= 0 ? usage.prompt_tokens : undefined;
  const completionTokens = Number.isInteger(usage.completion_tokens) && usage.completion_tokens >= 0 ? usage.completion_tokens : undefined;
  if (completionTokens !== undefined && completionTokens > maxOutputTokens) throw new Error("AI_PROVIDER_INVALID_RESPONSE");
  return { content, providerRequestId: typeof value?.id === "string" ? value.id.slice(0, 160) : undefined, promptTokens, completionTokens };
}
