'use client';

import Link from 'next/link';
import { useState } from 'react';

const SCENES = [
  'requirement review',
  'debugging',
  'code review',
  'incident response',
  'documentation',
];

export default function GeneratePage() {
  const [scene, setScene] = useState(SCENES[0]);
  const [wordCount, setWordCount] = useState(50);
  const [manualWords, setManualWords] = useState('');
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setArticle(null);
    setError(null);
    let manualList = manualWords
      .split(/[\n,]+/)
      .map((word) => word.trim())
      .filter(Boolean);

    let response = await fetch('/api/articles/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene, wordCount, manualWords: manualList }),
    });
    let text = await response.text();
    let data = text ? JSON.parse(text) : {};
    setLoading(false);
    if (!response.ok) {
      setError(data?.error ?? 'Failed to generate');
      return;
    }
    setArticle(data);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="mx-auto max-w-screen-sm px-5 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Generate Scenario Story</h1>
          <Link href="/" className="text-sm font-semibold text-gray-600">
            Back
          </Link>
        </div>
        <form onSubmit={onSubmit} className="mt-4 space-y-3 text-sm">
          <label className="block">
            <span className="font-semibold">Scene</span>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 p-2"
              value={scene}
              onChange={(event) => setScene(event.target.value)}
            >
              {SCENES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-semibold">Word count</span>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-gray-200 p-2"
              value={wordCount}
              onChange={(event) => setWordCount(Number(event.target.value))}
              min={10}
              max={80}
            />
          </label>
          <label className="block">
            <span className="font-semibold">Manual words</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-200 p-2"
              rows={4}
              placeholder="One word per line or separated by commas."
              value={manualWords}
              onChange={(event) => setManualWords(event.target.value)}
            />
          </label>
          <button
            type="submit"
            className="rounded-md border border-black px-4 py-2 text-sm font-semibold"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        {article ? (
          <div className="mt-6 space-y-4 text-sm">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="font-semibold">English</p>
              <div
                className="mt-2 whitespace-pre-wrap text-gray-700"
                dangerouslySetInnerHTML={{ __html: article.contentEn }}
              />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="font-semibold">Chinese</p>
              <div
                className="mt-2 whitespace-pre-wrap text-gray-700"
                dangerouslySetInnerHTML={{ __html: article.contentZh }}
              />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="font-semibold">Grammar</p>
              <p className="mt-2 whitespace-pre-wrap text-gray-700">
                {article.grammarNotes}
              </p>
            </div>
            {article.articleId ? (
              <Link
                href={`/learn/dictation/${article.articleId}`}
                className="inline-flex items-center rounded-md border border-black px-4 py-2 text-sm font-semibold"
              >
                Start Dictation
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
