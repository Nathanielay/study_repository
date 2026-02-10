'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type WordNetworkItem = {
  word: string;
  phrases: string[];
  cn: string;
  isNew: boolean;
  source: string;
};

export default function ReviewPage() {
  const params = useParams();
  const articleId = Number(params?.articleId ?? 0);
  const [items, setItems] = useState<WordNetworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!articleId) return;
    let aborted = false;
    async function load() {
      setLoading(true);
      setError(null);
      let response = await fetch(`/api/review/word-network?articleId=${articleId}`);
      let data = await response.json();
      if (aborted) return;
      setLoading(false);
      if (!response.ok) {
        setError(data?.error ?? 'Failed to load');
        return;
      }
      setItems(Array.isArray(data.items) ? data.items : []);
    }
    load();
    return () => {
      aborted = true;
    };
  }, [articleId]);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="mx-auto max-w-screen-sm px-5 py-8">
        <header className="mb-4">
          <h1 className="text-xl font-semibold">Word Network Review</h1>
          <p className="text-xs text-gray-500">5 core words, 2 phrases each</p>
        </header>

        {loading ? <p className="text-sm">Loading...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.word} className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
              <div className="flex items-center justify-between">
                <Link href={`/word/${encodeURIComponent(item.word)}`} className="font-semibold">
                  {item.word}
                </Link>
                {item.isNew ? (
                  <span className="text-xs rounded-full border border-gray-200 px-2 py-0.5 text-gray-500">
                    new
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-gray-500">{item.cn}</p>
              <ul className="mt-2 list-disc pl-5 text-xs text-gray-600">
                {item.phrases.map((phrase) => (
                  <li key={phrase}>{phrase}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Link href="/errors" className="text-sm font-semibold text-gray-700">
            View error list
          </Link>
        </div>
      </div>
    </div>
  );
}
