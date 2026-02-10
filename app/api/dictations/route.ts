import { NextResponse } from 'next/server';
import {
  createDictation,
  getArticleById,
  upsertErrorWord,
} from 'app/db';
import {
  buildDiffHtml,
  diffTokens,
  extractErrorWords,
  tokenize,
} from 'app/lib/dictation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body = await request.json();
  let articleId = Number(body?.articleId ?? 0);
  let inputText = String(body?.inputText ?? '');
  if (!articleId) {
    return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
  }

  let articleRows = await getArticleById(articleId);
  if (articleRows.length === 0) {
    return NextResponse.json({ error: 'article not found' }, { status: 404 });
  }

  let referenceText = String(articleRows[0].contentEn ?? '');
  let referenceTokens = tokenize(referenceText);
  let inputTokens = tokenize(inputText);
  let ops = diffTokens(referenceTokens, inputTokens);
  let errorWords = extractErrorWords(ops);
  let errors = ops.filter((op) => op.op !== 'equal').length;
  let total = referenceTokens.length || 1;
  let score = Math.max(0, Math.round(((total - errors) / total) * 100));
  let diffHtml = buildDiffHtml(ops);

  await createDictation({
    userId: null,
    articleId,
    inputText,
    normalizedText: inputTokens.join(' '),
    score,
    diffJson: ops,
    errorWords,
  });

  for (let word of errorWords) {
    await upsertErrorWord({ userId: null, word, sourceArticleId: articleId });
  }

  return NextResponse.json({
    score,
    diffHtml,
    errors: errorWords,
  });
}
