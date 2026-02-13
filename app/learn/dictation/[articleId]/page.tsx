import { BackButton } from 'app/components/back-button';
import { DictationForm } from 'app/components/dictation-form';
import { getArticleById } from 'app/db';

export default async function DictationPage({
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
          <BackButton />
        </header>

        <details className="rounded-xl border border-gray-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Chinese Translation
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
            {article.contentZh}
          </p>
        </details>

        <DictationForm articleId={articleId} />
      </div>
    </div>
  );
}
