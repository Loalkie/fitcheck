export interface AiChatOptions {
  system: string;
  user: string;
  temperature?: number;
  json?: boolean;
}

export interface AiProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function getAiProviderConfig(): AiProviderConfig {
  return {
    apiKey: process.env.AI_API_KEY || "",
    baseUrl: (process.env.AI_API_URL || "https://api.deepseek.com/v1").replace(/\/+$/, ""),
    model: process.env.AI_MODEL || "deepseek-chat",
  };
}

export function hasAiProvider(): boolean {
  return Boolean(getAiProviderConfig().apiKey);
}

export async function aiChat(options: AiChatOptions): Promise<string> {
  const { apiKey, baseUrl, model } = getAiProviderConfig();
  if (!apiKey) throw new Error("NO_API_KEY");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: options.temperature ?? 0.2,
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.user },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`AI provider error ${response.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty AI response");
  return content;
}
