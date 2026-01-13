import { NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getProgress, getUserIdByEmail, updateProgress } from 'app/db';

export async function GET(request: Request) {
  let session = await auth();
  let email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let { searchParams } = new URL(request.url);
  let bookId = searchParams.get('bookId');
  if (!bookId) {
    return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });
  }

  let userId = await getUserIdByEmail(email);
  if (!userId) {
    return NextResponse.json({ progress: null });
  }

  let progress = await getProgress(userId, bookId);
  return NextResponse.json({ progress: progress[0] ?? null });
}

export async function POST(request: Request) {
  let session = await auth();
  let email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let userId = await getUserIdByEmail(email);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let body = await request.json();
  let { bookId, wordId, wordRank } = body ?? {};

  if (!bookId || !wordId || typeof wordRank !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  await updateProgress({ userId, bookId, wordId, wordRank });
  return NextResponse.json({ ok: true });
}
