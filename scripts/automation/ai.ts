import "dotenv/config";

type ProviderName = "gemini" | "groq" | "openrouter";

const providers: Array<[string, ProviderName]> = [
  ["GEMINI_API_KEY", "gemini"],
  ["GROQ_API_KEY", "groq"],
  ["OPENROUTER_API_KEY", "openrouter"],
];

function cleanJsonText(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function normalizeJson(value: unknown): Record<string, any> {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new Error("AI가 빈 배열을 반환했습니다.");
    }

    const first = value[0];

    if (!first || typeof first !== "object" || Array.isArray(first)) {
      throw new Error("AI 배열의 첫 번째 값이 객체가 아닙니다.");
    }

    console.warn("[AI] 배열 응답을 첫 번째 객체로 정규화했습니다.");

    return first as Record<string, any>;
  }

  if (!value || typeof value !== "object") {
    throw new Error("AI 응답이 JSON 객체가 아닙니다.");
  }

  return value as Record<string, any>;
}

function parseJson(text: string): Record<string, any> {
  const cleaned = cleanJsonText(text);

  try {
    return normalizeJson(JSON.parse(cleaned));
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start >= 0 && end > start) {
      try {
        return normalizeJson(JSON.parse(cleaned.slice(start, end + 1)));
      } catch {}
    }

    const arrayStart = cleaned.indexOf("[");
    const arrayEnd = cleaned.lastIndexOf("]");

    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      try {
        return normalizeJson(
          JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1)),
        );
      } catch {}
    }

    throw new Error("AI 응답을 JSON으로 파싱할 수 없습니다.");
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const text = await response.text();

    if (!text) {
      return `HTTP ${response.status}`;
    }

    return text.slice(0, 1000);
  } catch {
    return `HTTP ${response.status}`;
  }
}

async function callGemini(
  key: string,
  prompt: string,
): Promise<Record<string, any>> {
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Gemini HTTP ${response.status}: ${await readError(response)}`,
    );
  }

  const data: any = await response.json();

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: any) => part?.text || "")
    .join("")
    .trim();

  if (!text) {
    const reason =
      data?.candidates?.[0]?.finishReason ||
      data?.promptFeedback?.blockReason ||
      "응답 내용 없음";

    throw new Error(`Gemini 응답 없음: ${reason}`);
  }

  return parseJson(text);
}

async function callOpenAICompatible(
  provider: "groq" | "openrouter",
  key: string,
  prompt: string,
): Promise<Record<string, any>> {
  const isGroq = provider === "groq";

  const model = isGroq
    ? process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b"
    : process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";

  const url = isGroq
    ? "https://api.groq.com/openai/v1/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };

  if (!isGroq) {
    const siteUrl = process.env.OPENROUTER_SITE_URL?.trim();
    const siteName = process.env.OPENROUTER_SITE_NAME?.trim();

    if (siteUrl) {
      headers["HTTP-Referer"] = siteUrl;
    }

    if (siteName) {
      headers["X-Title"] = siteName;
    }
  }

  const body: Record<string, any> = {
    model,
    messages: [
      {
        role: "system",
        content:
          "You must return exactly one valid JSON object. Never return an array. Never use Markdown code fences.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_object",
    },
  };

  const maxTokens = Number(process.env.OPENROUTER_MAX_TOKENS);

  if (!isGroq && Number.isFinite(maxTokens) && maxTokens > 0) {
    body.max_tokens = maxTokens;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `${provider} HTTP ${response.status}: ${await readError(response)}`,
    );
  }

  const data: any = await response.json();

  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error(`${provider} 응답 내용 없음`);
  }

  return parseJson(content);
}

export async function ai(prompt: string): Promise<Record<string, any>> {
  const errors: string[] = [];

  for (const [keyName, provider] of providers) {
    const key = process.env[keyName];

    if (!key) {
      errors.push(`${provider}: API 키 없음`);
      continue;
    }

    try {
      console.log(`[AI] ${provider} 호출`);

      if (provider === "gemini") {
        const result = await callGemini(key, prompt);

        console.log(`[AI] ${provider} 성공`);

        return result;
      }

      const result = await callOpenAICompatible(provider, key, prompt);

      console.log(`[AI] ${provider} 성공`);

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.warn(`[AI] ${provider} 실패: ${message}`);

      errors.push(`${provider}: ${message}`);
    }
  }

  throw new Error(`AI provider 모두 실패\n${errors.join("\n")}`);
}
