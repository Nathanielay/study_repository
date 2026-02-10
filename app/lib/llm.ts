type LlmMessage = {
  role: 'user' | 'system' | 'assistant';
  content: string;
};

type LlmArticle = {
  title: string;
  content_en: string;
  content_zh: string;
  grammar_notes: string;
};

const DEFAULT_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const DEFAULT_MODEL = 'doubao-seed-1-6-lite-251015';
const DEFAULT_TIMEOUT_SECONDS = 60;

function getEnvValue(key: string, fallback: string) {
  return process.env[key] && process.env[key]!.trim()
    ? process.env[key]!.trim()
    : fallback;
}

export function getLlmConfig() {
  const rawTimeoutSeconds = Number(
    getEnvValue('LLM_TIMEOUT', String(DEFAULT_TIMEOUT_SECONDS))
  );
  const timeoutSeconds =
    Number.isFinite(rawTimeoutSeconds) && rawTimeoutSeconds > 0
      ? rawTimeoutSeconds
      : DEFAULT_TIMEOUT_SECONDS;
  const timeoutMs = Math.round(timeoutSeconds * 1000);
  return {
    baseUrl: getEnvValue('LLM_BASE_URL', DEFAULT_BASE_URL),
    apiKey:
      process.env.ARK_API_KEY?.trim() ||
      process.env.LLM_API_KEY?.trim() ||
      '',
    model: getEnvValue('LLM_MODEL', DEFAULT_MODEL),
    timeoutMs,
    reasoningEffort: process.env.LLM_REASONING_EFFORT?.trim() || '',
  };
}

export async function generateArticleFromLlm(
  prompt: string
): Promise<LlmArticle> {
  let { baseUrl, apiKey, model, timeoutMs, reasoningEffort } = getLlmConfig();
  if (!apiKey) {
    throw new Error('LLM API key is not set');
  }

  let controller = new AbortController();
  let timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let payload: Record<string, unknown> = {
      model,
      messages: [{ role: 'user', content: prompt } satisfies LlmMessage],
      temperature: 0.2,
    };

    if (reasoningEffort) {
      payload.reasoning_effort = reasoningEffort;
    }

    let response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      let text = await response.text();
      throw new Error(`LLM request failed: ${response.status} ${text}`);
    }

    let data = await response.json();
    let content = data?.choices?.[0]?.message?.content ?? '';
    if (!content) {
      throw new Error('LLM response is empty');
    }

    let parsed = safeJsonParse(content);
    let title = String(parsed?.title ?? '').trim();
    let contentEn = String(parsed?.content_en ?? '').trim();
    let contentZh = String(parsed?.content_zh ?? '').trim();
    let grammarNotes = String(parsed?.grammar_notes ?? '').trim();

    if (!title || !contentEn || !contentZh || !grammarNotes) {
      throw new Error('LLM response missing required fields');
    }

    return {
      title,
      content_en: contentEn,
      content_zh: contentZh,
      grammar_notes: grammarNotes,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse(raw: string) {
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  }

  try {
    return JSON.parse(text);
  } catch {
    let start = text.indexOf('{');
    let end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      let sliced = text.slice(start, end + 1);
      return JSON.parse(sliced);
    }
    throw new Error('LLM response is not valid JSON');
  }
}
