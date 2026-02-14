import { NextResponse } from 'next/server';
import {
  getArticleById,
  getWordNetworkCache,
  listErrorWords,
  upsertWordNetworkCache,
} from 'app/db';

export const dynamic = 'force-dynamic';

const CORE_WORD_COUNT = 10;
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
  let errorRows = await listErrorWords(null);
  let errorMap = new Map(
    errorRows.map((row) => [row.word, { count: row.count, lastWrongAt: row.lastWrongAt }])
  );
  let errorWords = wordList
    .filter((word) => errorMap.has(word))
    .map((word) => ({
      word,
      count: errorMap.get(word)?.count ?? 0,
      lastWrongAt: errorMap.get(word)?.lastWrongAt ?? null,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      let aTime = a.lastWrongAt ? new Date(a.lastWrongAt).getTime() : 0;
      let bTime = b.lastWrongAt ? new Date(b.lastWrongAt).getTime() : 0;
      return bTime - aTime;
    })
    .map((item) => item.word);

  let coreWords: string[] = [];
  for (let word of errorWords) {
    if (coreWords.length >= CORE_WORD_COUNT) break;
    if (!coreWords.includes(word)) coreWords.push(word);
  }
  for (let word of wordList) {
    if (coreWords.length >= CORE_WORD_COUNT) break;
    if (!coreWords.includes(word)) coreWords.push(word);
  }

  let items = coreWords.map((word) => ({
    word,
    phrases: buildPhrases(word).slice(0, PHRASE_COUNT),
    cn: '（释义占位）',
    isNew: false,
    source: errorMap.has(word) ? 'error' : 'article',
  }));

  await upsertWordNetworkCache({
    articleId,
    coreWords,
    items,
  });

  return NextResponse.json({ coreWords, items });
}
