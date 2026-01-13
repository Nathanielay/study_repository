import { NextResponse } from 'next/server';
import { createUser, getUser } from 'app/db';

export async function POST(request: Request) {
  let body = await request.json();
  let email = String(body?.email ?? '').trim().toLowerCase();
  let password = String(body?.password ?? '');

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  let existing = await getUser(email);
  if (existing.length > 0) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 });
  }

  await createUser(email, password);
  return NextResponse.json({ ok: true });
}
