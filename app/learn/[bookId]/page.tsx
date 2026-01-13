import { redirect } from 'next/navigation';
import { auth } from 'app/auth';
import { getBookById, getProgress, getUserIdByEmail, getWordsByBook } from 'app/db';
import Link from 'next/link';
import { LearningCard } from 'app/components/learning-card';

export default async function LearnPage({
  params,
}: {
  params: { bookId: string };
}) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect('/login');
  }

  const userId = await getUserIdByEmail(email);
  if (!userId) {
    redirect('/login');
  }

  const book = await getBookById(params.bookId);
  const progress = await getProgress(userId, params.bookId);
  const startRank = progress[0]?.currentWordRank ?? 0;
  const words = await getWordsByBook(params.bookId, startRank, 1);
  const initialWord = words[0]
    ? {
        wordId: words[0].wordId!,
        headWord: words[0].headWord!,
        wordRank: words[0].wordRank!,
        content: words[0].content,
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-50 px-5 py-8">
      <div className="mx-auto max-w-screen-sm">
        <header className="mb-6">
          <Link href="/" className="text-sm text-gray-500">
            Back
          </Link>
          <p className="mt-2 text-xs text-gray-500">Learning</p>
          <h1 className="text-2xl font-semibold">{book[0]?.title ?? 'Word Book'}</h1>
        </header>

        <LearningCard bookId={params.bookId} initialWord={initialWord} />
      </div>
    </div>
  );
}
