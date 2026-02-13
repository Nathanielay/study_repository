type LlmMessage = {
  role: 'user' | 'system' | 'assistant';
  content: string;
};

type LlmArticle = {
  title: string;
  content_en: string;
  content_zh: string;
  grammar_notes: string;
  glossary?: { word: string; translation: string }[];
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
    let grammarNotes = normalizeGrammarNotes(parsed?.grammar_notes);
    let rawGlossary = Array.isArray(parsed?.glossary) ? parsed.glossary : [];
    let glossary = rawGlossary
      .map((entry: any) => ({
        word: String(entry?.word ?? '').trim(),
        translation: String(entry?.translation ?? '').trim(),
      }))
      .filter((entry: { word: string; translation: string }) => entry.word && entry.translation);

    if (!title || !contentEn || !contentZh || !grammarNotes) {
      throw new Error('LLM response missing required fields');
    }

    return {
      title,
      content_en: contentEn,
      content_zh: contentZh,
      grammar_notes: grammarNotes,
      glossary,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeDictationWithLlm(params: {
  reference: string;
  input: string;
  spellingCount: number;
  missingCount: number;
  extraCount: number;
}) {
  let { baseUrl, apiKey, model, timeoutMs, reasoningEffort } = getLlmConfig();
  if (!apiKey) return '';

  let controller = new AbortController();
  let timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let prompt = [
      'You are a strict English coach for exam dictation practice.',
      'Analyze the user input against the reference text.',
      'Focus on grammar, spelling, and likely missing words.',
      'Respond in Chinese with concise bullet points.',
      `Spelling errors: ${params.spellingCount}`,
      `Missing words: ${params.missingCount}`,
      `Extra words: ${params.extraCount}`,
      `Reference: ${params.reference}`,
      `User input: ${params.input}`,
    ].join('\n');

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
    return String(content).trim();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeGrammarNotes(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    let lines = value
      .map((entry) => normalizeGrammarNotes(entry))
      .filter(Boolean);
    return lines.join('\n');
  }
  if (value && typeof value === 'object') {
    let record = value as Record<string, unknown>;
    let sentence = String(record.sentence ?? record.text ?? '').trim();
    let note = String(
      record.note ?? record.notes ?? record.grammar ?? record.analysis ?? ''
    ).trim();
    if (sentence && note) {
      return `Sentence: ${sentence}\nNote: ${note}`;
    }
    try {
      return JSON.stringify(record, null, 2);
    } catch {
      return '';
    }
  }
  return '';
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
