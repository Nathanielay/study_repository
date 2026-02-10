import { NextResponse } from 'next/server';
import { getReviewQueue } from 'app/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  let items = await getReviewQueue(null);
  return NextResponse.json({ items });
}
