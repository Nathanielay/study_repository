import { NextResponse } from 'next/server';
import { pingDb } from 'app/db';

export async function GET() {
  try {
    await pingDb();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('health check failed', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
