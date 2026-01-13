import { NextResponse } from 'next/server';
import { getWordById } from 'app/db';

export async function GET(
  _request: Request,
  { params }: { params: { wordId: string } }
) {
  let word = await getWordById(params.wordId);
  if (word.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ word: word[0] });
}
