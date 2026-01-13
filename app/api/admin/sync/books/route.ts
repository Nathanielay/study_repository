import { NextResponse } from 'next/server';
import { upsertBooks } from 'app/db';

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
  let items = Array.isArray(body?.books) ? body.books : [];
  let normalized = items
    .map((item: any) => ({
      bookId: String(item.book_id ?? item.bookId ?? '').trim(),
      title: String(item.title ?? '').trim(),
      wordCount: Number(item.word_count ?? item.wordCount ?? 0),
      coverUrl: String(item.cover_url ?? item.coverUrl ?? '').trim(),
      tags: item.tags ?? [],
    }))
    .filter((item: { bookId: string; title: string }) => item.bookId && item.title);

  await upsertBooks(normalized);

  return NextResponse.json({ ok: true, count: normalized.length });
}
