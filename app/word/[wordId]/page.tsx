import { getWordById } from 'app/db';
import Link from 'next/link';

function getList(value: any) {
  return Array.isArray(value) ? value : [];
}

export default async function WordDetailPage({
  params,
  searchParams,
}: {
  params: { wordId: string };
  searchParams?: { from?: string };
}) {
  const word = await getWordById(params.wordId);
  const record = word[0];

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-50 px-5 py-8">
        <div className="mx-auto max-w-screen-sm">Not found.</div>
      </div>
    );
  }

  const content = record.content as any;
  const info =
    content?.word?.content ??
    content?.content?.word?.content ??
    content?.content ??
    {};
  const trans = getList(info.trans);
  const sentences = getList(info.sentence?.sentences);
  const phrases = getList(info.phrase?.phrases);
  const synos = getList(info.syno?.synos);

  return (
    <div className="min-h-screen bg-gray-50 px-5 py-8">
      <div className="mx-auto max-w-screen-sm">
        <Link href={searchParams?.from ?? '/'} className="text-sm text-gray-500">
          Back
        </Link>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6">
          <h1 className="text-3xl font-semibold">{record.headWord}</h1>
          <p className="mt-2 text-sm text-gray-500">
            UK: {info.ukphone ?? '-'} · US: {info.usphone ?? '-'}
          </p>

          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Meanings</h2>
            {trans.length === 0 ? (
              <p className="text-sm text-gray-500">No meanings</p>
            ) : (
              <ul className="space-y-2 text-sm text-gray-700">
                {trans.map((item: any, index: number) => (
                  <li key={index}>
                    {item.pos ? `${item.pos}. ` : ''}
                    {item.tranCn ?? ''}
                    {item.tranOther ? ` (${item.tranOther})` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Examples</h2>
            {sentences.length === 0 ? (
              <p className="text-sm text-gray-500">No examples</p>
            ) : (
              <ul className="space-y-2 text-sm text-gray-700">
                {sentences.map((item: any, index: number) => (
                  <li key={index}>
                    {item.sContent}
                    {item.sCn ? ` - ${item.sCn}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Phrases</h2>
            {phrases.length === 0 ? (
              <p className="text-sm text-gray-500">No phrases</p>
            ) : (
              <ul className="space-y-2 text-sm text-gray-700">
                {phrases.map((item: any, index: number) => (
                  <li key={index}>
                    {item.pContent} {item.pCn ? `- ${item.pCn}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Synonyms</h2>
            {synos.length === 0 ? (
              <p className="text-sm text-gray-500">No synonyms</p>
            ) : (
              <ul className="space-y-2 text-sm text-gray-700">
                {synos.map((item: any, index: number) => (
                  <li key={index}>
                    {item.pos ? `${item.pos}. ` : ''}
                    {item.tran ?? ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
