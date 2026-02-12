import Link from 'next/link';
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
      <div className="mx-auto max-w-screen-sm px-5 py-8 space-y-4">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500">{article.scene}</p>
            <h1 className="text-xl font-semibold">{article.title}</h1>
          </div>
          <Link
            href="/learn/articles"
            className="text-sm font-semibold text-gray-600"
          >
            Back
          </Link>
        </header>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="font-semibold">English</p>
          <div
            className="mt-2 whitespace-pre-wrap text-gray-700"
            dangerouslySetInnerHTML={{ __html: article.contentEn }}
          />
        </div>

        <details className="rounded-xl border border-gray-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Chinese Translation
          </summary>
          <div
            className="mt-2 whitespace-pre-wrap text-gray-700"
            dangerouslySetInnerHTML={{ __html: article.contentZh }}
          />
        </details>

        <details className="rounded-xl border border-gray-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Grammar Notes
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-gray-700">
            {article.grammarNotes}
          </p>
        </details>

        <Link
          href={`/learn/dictation/${articleId}`}
          className="inline-flex items-center rounded-md border border-black px-4 py-2 text-sm font-semibold"
        >
          Start dictation
        </Link>
      </div>
    </div>
  );
}
