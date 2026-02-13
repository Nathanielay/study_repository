import Link from 'next/link';
import { BackButton } from 'app/components/back-button';
import { getArticleById } from 'app/db';

export default async function ArticleDetailPage({
  params,
}: {
  params: { articleId: string };
}) {
  let articleId = Number(params.articleId);
  let rows = await getArticleById(articleId);
  if (rows.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 px-5 py-8 text-sm">
        <p>Article not found.</p>
      </div>
    );
  }

  let article = rows[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="mx-auto max-w-screen-sm px-5 py-8 space-y-6">
        <header className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {article.scene}
            </p>
            <h1 className="text-2xl font-semibold leading-tight">{article.title}</h1>
          </div>
          <BackButton />
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Quick Actions
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/learn/dictation/${articleId}`}
              className="inline-flex items-center rounded-md border border-black px-4 py-2 text-sm font-semibold"
            >
              Start dictation
            </Link>
            <Link
              href={`/learn/dictation/${articleId}/records`}
              className="inline-flex items-center rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
            >
              View training records
            </Link>
            <Link
              href={`/review/${articleId}`}
              className="inline-flex items-center rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
            >
              Go to review
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            English
          </p>
          <div
            className="mt-3 whitespace-pre-wrap text-gray-700"
            dangerouslySetInnerHTML={{ __html: article.contentEn }}
          />
        </section>

        <details className="rounded-2xl border border-gray-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Chinese Translation
          </summary>
          <div
            className="mt-3 whitespace-pre-wrap text-gray-700"
            dangerouslySetInnerHTML={{ __html: article.contentZh }}
          />
        </details>

        <details className="rounded-2xl border border-gray-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Grammar Notes
          </summary>
          <p className="mt-3 whitespace-pre-wrap text-gray-700">
            {article.grammarNotes}
          </p>
        </details>
      </div>
    </div>
  );
}
