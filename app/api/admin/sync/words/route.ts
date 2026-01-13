import { NextResponse } from 'next/server';
import { upsertWords } from 'app/db';

function authorize(request: Request) {
  let token = process.env.SYNC_TOKEN;
  if (!token) return true;
  return request.headers.get('x-sync-token') === token;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body = await request.json();
  let items = Array.isArray(body?.words) ? body.words : [];
  let normalized = items
    .map((item: any) => ({
      bookId: String(item.book_id ?? item.bookId ?? '').trim(),
      wordId: String(item.word_id ?? item.wordId ?? '').trim(),
      headWord: String(item.head_word ?? item.headWord ?? '').trim(),
      wordRank: Number(item.word_rank ?? item.wordRank ?? 0),
      content: item.content ?? {},
    }))
    .filter((item: { bookId: string; wordId: string; headWord: string }) =>
      item.bookId && item.wordId && item.headWord
    );

  await upsertWords(normalized);

  return NextResponse.json({ ok: true, count: normalized.length });
}
