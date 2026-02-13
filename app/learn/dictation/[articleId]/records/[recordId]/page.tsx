import Link from 'next/link';
import { BackButton } from 'app/components/back-button';
import { getArticleById, getDictationById } from 'app/db';
import { buildReferenceHighlightHtml } from 'app/lib/dictation';

export default async function DictationRecordDetailPage({
  params,
}: {
  params: { articleId: string; recordId: string };
}) {
  let recordId = Number(params.recordId);
  let rows = await getDictationById(recordId);
  if (rows.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 px-5 py-8 text-sm">
        <p>Record not found.</p>
      </div>
    );
  }

  let record = rows[0];
  let articleRows = await getArticleById(record.articleId);
  let article = articleRows[0];
  let referenceHtml = record.referenceHtml;
  if (!referenceHtml && article) {
    let ops = Array.isArray(record.diffJson) ? record.diffJson : [];
    referenceHtml = buildReferenceHighlightHtml(article.contentEn, ops).html;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="mx-auto max-w-screen-sm px-5 py-8 space-y-4">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500">Record #{record.id}</p>
            <h1 className="text-xl font-semibold">Score: {record.score}</h1>
            <p className="text-xs text-gray-600">
              Errors {record.spellingCount + record.missingCount} · Spelling{' '}
              {record.spellingCount} · Missing {record.missingCount} · Extra{' '}
              {record.extraCount}
            </p>
          </div>
          <BackButton />
        </header>

        {article ? (
          <details className="rounded-xl border border-gray-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold">
              Chinese Translation
            </summary>
            <div
              className="mt-2 whitespace-pre-wrap text-sm text-gray-700"
              dangerouslySetInnerHTML={{ __html: article.contentZh }}
            />
          </details>
        ) : null}

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="font-semibold text-sm">User Dictation</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
            {record.inputText}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="font-semibold text-sm">Reference (Highlighted)</p>
          {referenceHtml ? (
            <div
              className="mt-2 whitespace-pre-wrap text-sm text-gray-700"
              dangerouslySetInnerHTML={{ __html: referenceHtml }}
            />
          ) : (
            <p className="mt-2 text-sm text-gray-500">No reference available.</p>
          )}
        </div>

        {record.analysis ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="font-semibold text-sm">LLM Analysis</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
              {record.analysis}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
