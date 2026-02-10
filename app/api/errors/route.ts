import { NextResponse } from 'next/server';
import { listErrorWords } from 'app/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  let rows = await listErrorWords(null);
  return NextResponse.json({ items: rows });
}
