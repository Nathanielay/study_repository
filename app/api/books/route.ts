import { NextResponse } from 'next/server';
import { getBooks } from 'app/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  let books = await getBooks();
  return NextResponse.json({ books });
}
