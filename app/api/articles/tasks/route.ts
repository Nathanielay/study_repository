import { NextResponse } from 'next/server';
import { createArticleTask } from 'app/db';

export const dynamic = 'force-dynamic';

const DEFAULT_WORD_COUNT = 35;
const MIN_WORD_COUNT = 10;
const MAX_WORD_COUNT = 50;

export async function POST(request: Request) {
  let body = await request.json();
  let scene = String(body?.scene ?? '').trim();
  if (!scene) {
    return NextResponse.json({ error: 'scene is required' }, { status: 400 });
  }

  let manualWords = Array.isArray(body?.manualWords) ? body.manualWords : [];
  let wordCount = Number(body?.wordCount ?? DEFAULT_WORD_COUNT);
  if (!Number.isFinite(wordCount)) wordCount = DEFAULT_WORD_COUNT;
  wordCount = Math.min(MAX_WORD_COUNT, Math.max(MIN_WORD_COUNT, wordCount));

  let taskId = await createArticleTask({
    userId: null,
    scene,
    wordCount,
    manualWords,
  });

  if (!taskId) {
    return NextResponse.json(
      { error: 'failed to create task' },
      { status: 500 }
    );
  }

  return NextResponse.json({ taskId });
}
