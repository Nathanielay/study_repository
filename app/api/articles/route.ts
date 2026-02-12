import { NextResponse } from 'next/server';
import { listArticles } from 'app/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  let items = await listArticles();
  return NextResponse.json({ items });
}
