import { NextResponse } from 'next/server';
import { getWordsByBook } from 'app/db';

export async function GET(
  request: Request,
  { params }: { params: { bookId: string } }
) {
  let { searchParams } = new URL(request.url);
  let startRank = Number(searchParams.get('startRank') ?? '0');
  let limit = Number(searchParams.get('limit') ?? '1');

  if (Number.isNaN(startRank) || Number.isNaN(limit)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  let words = await getWordsByBook(params.bookId, startRank, limit);
  return NextResponse.json({ words });
}
