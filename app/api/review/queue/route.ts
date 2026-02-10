import { NextResponse } from 'next/server';
import { getReviewQueue } from 'app/db';

export async function GET() {
  let items = await getReviewQueue(null);
  return NextResponse.json({ items });
}
