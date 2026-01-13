import { auth, signOut } from 'app/auth';
import { getBookById, getProgress, getRecentLearning, getUserIdByEmail } from 'app/db';
import { TabBar } from 'app/components/tab-bar';
import { MeScreen } from 'app/components/me-screen';

export default async function MePage() {
  const session = await auth();
  const email = session?.user?.email ?? null;

  let progressInfo: {
    bookTitle?: string;
    learnedCount?: number;
    totalWords?: number;
  } | null = null;

  if (email) {
    const userId = await getUserIdByEmail(email);
    if (userId) {
      const recent = await getRecentLearning(userId);
      if (recent.length > 0) {
        const book = await getBookById(recent[0].bookId ?? '');
        const progress = await getProgress(userId, recent[0].bookId ?? '');
        progressInfo = {
          bookTitle: book[0]?.title ?? 'Unknown',
          learnedCount: progress[0]?.learnedCount ?? 0,
          totalWords: book[0]?.wordCount ?? 0,
        };
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-screen-sm px-5 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Me</h1>
          <p className="mt-1 text-sm text-gray-500">Your account and progress.</p>
        </header>

        <MeScreen email={email} progress={progressInfo} />

        {email ? (
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
            className="mt-4"
          >
            <button
              type="submit"
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold"
            >
              Sign out
            </button>
          </form>
        ) : null}
      </div>

      <TabBar />
    </div>
  );
}
