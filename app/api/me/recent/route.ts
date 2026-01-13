import { NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getRecentLearning, getUserIdByEmail } from 'app/db';

export async function GET() {
  let session = await auth();
  let email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let userId = await getUserIdByEmail(email);
  if (!userId) {
    return NextResponse.json({ recent: null });
  }

  let recent = await getRecentLearning(userId);
  return NextResponse.json({ recent: recent[0] ?? null });
}
