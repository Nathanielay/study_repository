const mysql = require('mysql2/promise');
require('dotenv').config();

const DEFAULT_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const DEFAULT_MODEL = 'doubao-seed-1-6-lite-251015';
const DEFAULT_TIMEOUT_SECONDS = 120;
const DEFAULT_WORD_COUNT = 35;
const MAX_BATCH = 3;

function getEnv(key, fallback = '') {
  return process.env[key] && process.env[key].trim()
    ? process.env[key].trim()
    : fallback;
}

function getLlmConfig() {
  const rawTimeout = Number(getEnv('LLM_TIMEOUT', String(DEFAULT_TIMEOUT_SECONDS)));
  const timeoutSeconds = Number.isFinite(rawTimeout) && rawTimeout > 0
    ? rawTimeout
    : DEFAULT_TIMEOUT_SECONDS;
  return {
    baseUrl: getEnv('LLM_BASE_URL', DEFAULT_BASE_URL),
    apiKey: getEnv('ARK_API_KEY') || getEnv('LLM_API_KEY'),
    model: getEnv('LLM_MODEL', DEFAULT_MODEL),
    timeoutMs: Math.round(timeoutSeconds * 1000),
  };
}

function buildPrompt(scene, words, manualWords) {
  const wordList = words.join(', ');
  const manualList = manualWords.length > 0 ? manualWords.join(', ') : 'None';
  return [
    'You are a bilingual English coach for computer science entrance exams.',
    `Scene: ${scene}`,
    `Target words (must cover, around 35): ${wordList}`,
    `Manual words: ${manualList}`,
    'Requirements:',
    '1) Write a 150-2000 English-word passage in a formal exam reading style.',
    '2) Cover the target words with natural usage; inflections are allowed.',
    '3) Use common English words for all other wording.',
    '4) Highlight target words in the English passage with <mark> tags.',
    '5) Highlight the corresponding Chinese translations in content_zh with <mark> tags.',
    '6) Output JSON only with keys: title, content_en, content_zh, grammar_notes.',
    '7) Do not wrap the JSON in code fences.',
    '8) content_zh is a natural Chinese translation.',
    '9) grammar_notes provides detailed, sentence-by-sentence grammar analysis in Chinese.',
  ].join('\n');
}

function safeJsonParse(raw) {
  let text = String(raw || '').trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  }
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error('LLM response is not valid JSON');
  }
}

async function callLlm(prompt) {
  const { baseUrl, apiKey, model, timeoutMs } = getLlmConfig();
  if (!apiKey) {
    throw new Error('LLM API key is not set');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LLM request failed: ${response.status} ${text}`);
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    if (!content) throw new Error('LLM response is empty');
    return safeJsonParse(content);
  } finally {
    clearTimeout(timeout);
  }
}

async function runOnce() {
  const url = process.env.MYSQL_URL;
  if (!url) throw new Error('MYSQL_URL is not set');

  const conn = await mysql.createConnection(url);
  try {
    const [tasks] = await conn.query(
      `SELECT * FROM article_tasks WHERE status='pending' ORDER BY id ASC LIMIT ${MAX_BATCH}`
    );

    for (const task of tasks) {
      await conn.execute(
        "UPDATE article_tasks SET status='processing', updated_at=NOW() WHERE id=?",
        [task.id]
      );

      let manualWords = [];
      try {
        manualWords = JSON.parse(task.manual_words || '[]');
      } catch {
        manualWords = [];
      }

      const wordCount = Number(task.word_count || DEFAULT_WORD_COUNT);
      let wordList = [];
      if (manualWords.length > 0) {
        wordList = manualWords.map((w) => String(w || '').trim()).filter(Boolean);
      } else {
        const [rows] = await conn.execute(
          'SELECT head_word AS headWord FROM words ORDER BY word_rank LIMIT ?',
          [wordCount]
        );
        wordList = rows.map((row) => row.headWord);
      }

      if (wordList.length === 0) {
        await conn.execute(
          "UPDATE article_tasks SET status='failed', error=? WHERE id=?",
          ['word list is empty', task.id]
        );
        continue;
      }

      try {
        const prompt = buildPrompt(task.scene, wordList, manualWords);
        const article = await callLlm(prompt);

        const [result] = await conn.execute(
          'INSERT INTO articles (user_id, scene, title, content_en, content_zh, grammar_notes, word_list, manual_words, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
          [
            task.user_id,
            task.scene,
            String(article.title || '').trim(),
            String(article.content_en || '').trim(),
            String(article.content_zh || '').trim(),
            String(article.grammar_notes || '').trim(),
            JSON.stringify(wordList),
            JSON.stringify(manualWords),
          ]
        );

        await conn.execute(
          "UPDATE article_tasks SET status='done', article_id=?, updated_at=NOW() WHERE id=?",
          [result.insertId, task.id]
        );
      } catch (err) {
        await conn.execute(
          "UPDATE article_tasks SET status='failed', error=?, updated_at=NOW() WHERE id=?",
          [String(err.message || err), task.id]
        );
      }
    }
  } finally {
    await conn.end();
  }
}

runOnce().catch((err) => {
  console.error(err);
  process.exit(1);
});
