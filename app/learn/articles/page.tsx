'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TabBar } from 'app/components/tab-bar';

type ArticleItem = {
  id: number;
  title: string;
  scene: string;
  createdAt: string;
};

export default function ArticlesPage() {
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    async function load() {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/articles');
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
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
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-screen-sm px-5 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Articles</h1>
          <Link href="/learn/generate" className="text-sm font-semibold text-gray-600">
            Generate
          </Link>
        </div>

        {loading ? <p className="text-sm">Loading...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 space-y-2 text-sm">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">{item.scene}</p>
              <p className="font-semibold">{item.title}</p>
              <Link
                href={`/learn/articles/${item.id}`}
                className="mt-2 inline-flex text-xs font-semibold text-gray-700"
              >
                View details
              </Link>
            </div>
          ))}
        </div>
      </div>
      <TabBar />
    </div>
  );
}
