import { NextResponse } from 'next/server';
import {
  getArticleById,
  getWordNetworkCache,
  listErrorWords,
  upsertWordNetworkCache,
} from 'app/db';

const CORE_WORD_COUNT = 5;
const PHRASE_COUNT = 2;

function buildPhrases(word: string) {
  return [
    `${word} workflow`,
    `resolve ${word} issue`,
  ];
}

export async function GET(request: Request) {
  let { searchParams } = new URL(request.url);
  let articleId = Number(searchParams.get('articleId') ?? 0);
  if (!articleId) {
    return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
  }

  let cached = await getWordNetworkCache(articleId);
  if (cached.length > 0) {
    return NextResponse.json({
      coreWords: cached[0].coreWords,
      items: cached[0].items,
    });
  }

  let articleRows = await getArticleById(articleId);
  if (articleRows.length === 0) {
    return NextResponse.json({ error: 'article not found' }, { status: 404 });
  }

  let wordList = Array.isArray(articleRows[0].wordList)
    ? articleRows[0].wordList
    : [];
  let errors = await listErrorWords(null);
  let errorWordList = errors.map((row) => row.word);

  let coreWords: string[] = [];
  for (let word of errorWordList) {
    if (coreWords.length >= Math.floor(CORE_WORD_COUNT / 2)) break;
    if (!coreWords.includes(word)) coreWords.push(word);
  }
  for (let word of wordList) {
    if (coreWords.length >= CORE_WORD_COUNT) break;
    if (!coreWords.includes(word)) coreWords.push(word);
  }

  let items = coreWords.map((word, index) => ({
    word,
    phrases: buildPhrases(word).slice(0, PHRASE_COUNT),
    cn: '（释义占位）',
    isNew: index >= Math.ceil(CORE_WORD_COUNT / 2),
    source: index < Math.floor(CORE_WORD_COUNT / 2) ? 'error' : 'article',
  }));

  await upsertWordNetworkCache({
    articleId,
    coreWords,
    items,
  });

  return NextResponse.json({ coreWords, items });
}
