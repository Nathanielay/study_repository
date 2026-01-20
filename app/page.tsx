import Link from 'next/link';
import { auth } from 'app/auth';
import { getBookById, getBooks, getRecentLearning, getUserIdByEmail } from 'app/db';
import { TabBar } from 'app/components/tab-bar';

export default async function Page() {
  const session = await auth();
  const isLoggedIn = !!session?.user?.email;
  const books = await getBooks();

  let recentBook: { bookId: string; title: string } | null = null;
  let recentData: { lastWordRank: number; lastWordId: string } | null = null;

  if (isLoggedIn && session?.user?.email) {
    const userId = await getUserIdByEmail(session.user.email);
    if (userId) {
      const recent = await getRecentLearning(userId);
      if (recent.length > 0) {
        const book = await getBookById(recent[0].bookId ?? '');
        if (book.length > 0) {
          recentBook = { bookId: book[0].bookId!, title: book[0].title! };
          recentData = {
            lastWordRank: recent[0].lastWordRank ?? 0,
            lastWordId: recent[0].lastWordId ?? '',
          };
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-screen-sm px-5 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Word Learning</h1>
          <p className="mt-1 text-sm text-gray-500">
            Learn words with quick, focused sessions.
          </p>
        </header>

        {recentBook && recentData ? (
          <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-700">Recent Learning</h2>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{recentBook.title}</p>
                <p className="text-xs text-gray-500">
                  Continue from #{recentData.lastWordRank + 1}
                </p>
              </div>
              <Link
                href={`/learn/${recentBook.bookId}`}
                className="rounded-md border border-black px-3 py-1 text-sm font-semibold"
              >
                Continue
              </Link>
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="text-sm font-semibold text-gray-700">All Books</h2>
          <div className="mt-3 space-y-3">
            {books.map((book) => {
              const href = isLoggedIn
                ? `/learn/${book.bookId}`
                : '/login';
              return (
                <Link
                  key={book.bookId}
                  href={href}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4"
                >
                  <div>
                    <p className="text-base font-semibold">{book.title}</p>
                    <p className="text-xs text-gray-500">
                      {book.wordCount ?? 0} words
                    </p>
                  </div>
                  <span className="text-sm text-gray-600">Start</span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-2 pb-8 text-center text-[10px] text-gray-500">
        <a
          href="https://beian.miit.gov.cn"
          target="_blank"
          rel="noreferrer"
          className="hover:text-gray-700"
        >
          网站核准号：浙ICP备2022034225号-1
        </a>
      </div>
      <TabBar />
    </div>
  );
}
