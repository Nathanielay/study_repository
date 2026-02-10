'use client';

import { useEffect, useState } from 'react';

type ErrorWord = {
  id: number;
  word: string;
  count: number;
  lastWrongAt: string;
};

export default function ErrorsPage() {
  const [items, setItems] = useState<ErrorWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    async function load() {
      setLoading(true);
      setError(null);
      let response = await fetch('/api/errors');
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
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="mx-auto max-w-screen-sm px-5 py-8">
        <h1 className="text-xl font-semibold">Error Words</h1>

        {loading ? <p className="text-sm">Loading...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 space-y-2 text-sm">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{item.word}</span>
                <span className="text-xs text-gray-500">x{item.count}</span>
              </div>
              <p className="text-xs text-gray-500">{item.lastWrongAt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
