import { NextResponse } from 'next/server';
import {
  createDictation,
  getArticleById,
  upsertErrorWord,
} from 'app/db';
import {
  buildReferenceHighlightHtml,
  diffTokens,
  extractErrorWords,
  tokenize,
} from 'app/lib/dictation';
import { analyzeDictationWithLlm } from 'app/lib/llm';

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
  let highlight = buildReferenceHighlightHtml(referenceText, ops);
  let analysis = '';
  try {
    analysis = await analyzeDictationWithLlm({
      reference: referenceText,
      input: inputText,
      spellingCount: highlight.spellingCount,
      missingCount: highlight.missingCount,
      extraCount: highlight.extraCount,
    });
  } catch (error) {
    console.error('dictation analysis failed', error);
  }

  await createDictation({
    userId: null,
    articleId,
    inputText,
    normalizedText: inputTokens.join(' '),
    score,
    referenceHtml: highlight.html,
    analysis,
    spellingCount: highlight.spellingCount,
    missingCount: highlight.missingCount,
    extraCount: highlight.extraCount,
    diffJson: ops,
    errorWords,
  });

  for (let word of errorWords) {
    await upsertErrorWord({ userId: null, word, sourceArticleId: articleId });
  }

  return NextResponse.json({
    score,
    referenceHtml: highlight.html,
    errors: errorWords,
    spellingCount: highlight.spellingCount,
    missingCount: highlight.missingCount,
    extraCount: highlight.extraCount,
    analysis,
  });
}
