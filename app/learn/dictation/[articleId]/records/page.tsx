import Link from 'next/link';
import { BackButton } from 'app/components/back-button';
import { listDictationsByArticle } from 'app/db';

export default async function DictationRecordsPage({
  params,
}: {
  params: { articleId: string };
}) {
  let articleId = Number(params.articleId);
  let items = await listDictationsByArticle(articleId);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="mx-auto max-w-screen-sm px-5 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Training Records</h1>
          <BackButton />
        </div>

        <div className="mt-4 space-y-2 text-sm">
          {items.length === 0 ? (
            <p className="text-gray-500">No records yet.</p>
          ) : null}
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
              </p>
              <p className="font-semibold">Score: {item.score}</p>
              <p className="text-xs text-gray-600">
                Errors {item.spellingCount + item.missingCount} · Spelling{' '}
                {item.spellingCount} · Missing {item.missingCount} · Extra {item.extraCount}
              </p>
              <Link
                href={`/learn/dictation/${articleId}/records/${item.id}`}
                className="mt-2 inline-flex text-xs font-semibold text-gray-700"
              >
                View details
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
