import { NextResponse } from 'next/server';
import { createArticle, getWordsSample } from 'app/db';
import { tokenize } from 'app/lib/dictation';
import { generateArticleFromLlm } from 'app/lib/llm';
import { withConcurrencyLimit } from 'app/lib/limiter';
import { redisGetJson, redisSetJson } from 'app/lib/redis';

export const dynamic = 'force-dynamic';

const DEFAULT_WORD_COUNT = 35;
const MIN_WORD_COUNT = 10;
const MAX_WORD_COUNT = 50;
const DEFAULT_CACHE_TTL_SECONDS = 86400;

function buildPrompt(scene: string, words: string[], manualWords: string[]) {
  let wordList = words.join(', ');
  let manualList = manualWords.length > 0 ? manualWords.join(', ') : 'None';

  return [
    'You are a bilingual English coach for computer science entrance exams.',
    `Scene: ${scene}`,
    `Target words (must cover, around 50): ${wordList}`,
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

function isWordCovered(word: string, tokens: Set<string>) {
  if (tokens.has(word)) return true;
  if (tokens.has(`${word}s`)) return true;
  if (tokens.has(`${word}es`)) return true;
  if (tokens.has(`${word}ed`)) return true;
  if (tokens.has(`${word}ing`)) return true;
  if (word.endsWith('y') && tokens.has(`${word.slice(0, -1)}ies`)) return true;
  if (word.endsWith('e') && tokens.has(`${word.slice(0, -1)}ed`)) return true;
  if (word.endsWith('e') && tokens.has(`${word.slice(0, -1)}ing`)) return true;
  if (word.endsWith('f') && tokens.has(`${word.slice(0, -1)}ves`)) return true;
  if (word.endsWith('fe') && tokens.has(`${word.slice(0, -2)}ves`)) return true;
  return false;
}

function countCoverage(words: string[], content: string) {
  let tokens = new Set(tokenize(content));
  let covered = 0;
  for (let word of words) {
    if (isWordCovered(word.toLowerCase(), tokens)) {
      covered += 1;
    }
  }
  return { covered, total: words.length };
}

export async function POST(request: Request) {
  try {
    let body = await request.json();
    let scene = String(body?.scene ?? '').trim();
    if (!scene) {
      return NextResponse.json({ error: 'scene is required' }, { status: 400 });
    }

    let manualWords = Array.isArray(body?.manualWords) ? body.manualWords : [];
    let wordCount = Number(body?.wordCount ?? DEFAULT_WORD_COUNT);
    if (!Number.isFinite(wordCount)) wordCount = DEFAULT_WORD_COUNT;
    wordCount = Math.min(MAX_WORD_COUNT, Math.max(MIN_WORD_COUNT, wordCount));

    let wordList = manualWords
      .map((word: unknown) => String(word ?? '').trim())
      .filter(Boolean);

    if (wordList.length === 0) {
      let fallback = await getWordsSample(wordCount);
      wordList = fallback.map((row) => row.headWord);
    }

    wordList = wordList.slice(0, wordCount);
    if (wordList.length === 0) {
      return NextResponse.json({ error: 'word list is empty' }, { status: 400 });
    }

    let cacheKey = [
      'article',
      scene,
      wordCount,
      wordList.join('|'),
      manualWords.join('|'),
    ].join(':');
    let prompt = buildPrompt(scene, wordList, manualWords);
    let cached = await redisGetJson<{
      title: string;
      content_en: string;
      content_zh: string;
      grammar_notes: string;
    }>(cacheKey);

    let article =
      cached ??
      (await withConcurrencyLimit(() => generateArticleFromLlm(prompt)));
    let coverage = countCoverage(wordList, article.content_en);
    if (coverage.total > 0 && coverage.covered / coverage.total < 0.8) {
      return NextResponse.json(
        { error: 'word coverage too low' },
        { status: 502 }
      );
    }

    let contentTokens = tokenize(article.content_en);
    if (contentTokens.length < 150 || contentTokens.length > 2000) {
      return NextResponse.json(
        { error: 'content length out of range' },
        { status: 502 }
      );
    }
    let articleId = await createArticle({
      userId: null,
      scene,
      title: article.title,
      contentEn: article.content_en,
      contentZh: article.content_zh,
      grammarNotes: article.grammar_notes,
      wordList,
      manualWords,
    });

    if (!cached) {
      let ttlSeconds = Number(process.env.LLM_CACHE_TTL ?? DEFAULT_CACHE_TTL_SECONDS);
      if (!Number.isFinite(ttlSeconds)) ttlSeconds = DEFAULT_CACHE_TTL_SECONDS;
      await redisSetJson(cacheKey, article, ttlSeconds);
    }

    return NextResponse.json({
      articleId,
      contentEn: article.content_en,
      contentZh: article.content_zh,
      grammarNotes: article.grammar_notes,
      wordList,
    });
  } catch (error: any) {
    console.error('generate article failed', error);
    return NextResponse.json(
      { error: error?.message ?? 'generate failed' },
      { status: 500 }
    );
  }
}
