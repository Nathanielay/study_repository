'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TabBar } from 'app/components/tab-bar';

const SCENES = [
  'requirement review',
  'debugging',
  'code review',
  'incident response',
  'documentation',
];

export default function GeneratePage() {
  const router = useRouter();
  const [scene, setScene] = useState(SCENES[0]);
  const [wordCount, setWordCount] = useState(50);
  const [manualWords, setManualWords] = useState('');
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setArticle(null);
    setError(null);
    setTaskStatus(null);
    let manualList = manualWords
      .split(/[\n,]+/)
      .map((word) => word.trim())
      .filter(Boolean);

    let response = await fetch('/api/articles/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene, wordCount, manualWords: manualList }),
    });
    let text = await response.text();
    let data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      setLoading(false);
      setError(data?.error ?? 'Failed to generate');
      return;
    }

    let taskId = Number(data?.taskId ?? 0);
    if (!taskId) {
      setLoading(false);
      setError('Failed to create task');
      return;
    }

    setTaskStatus('pending');

    let attempts = 0;
    while (attempts < 120) {
      attempts += 1;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      let statusResponse = await fetch(`/api/articles/tasks/${taskId}`);
      let statusText = await statusResponse.text();
      let statusData = statusText ? JSON.parse(statusText) : {};
      if (!statusResponse.ok) {
        setLoading(false);
        setError(statusData?.error ?? 'Failed to fetch task');
        return;
      }

      let status = String(statusData?.status ?? '');
      setTaskStatus(status);
      if (status === 'done') {
        setLoading(false);
        let articleId = Number(statusData?.articleId ?? statusData?.article?.id ?? 0);
        if (articleId) {
          router.push(`/learn/articles/${articleId}`);
          return;
        }
        setArticle(statusData.article ?? null);
        return;
      }
      if (status === 'failed') {
        setLoading(false);
        setError(statusData?.error ?? 'Generation failed');
        return;
      }
    }

    setLoading(false);
    setError('Generation timeout');
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-screen-sm px-5 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Generate Scenario Story</h1>
          <Link
            href="/learn/articles"
            className="text-sm font-semibold text-gray-600"
          >
            Articles
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
          {taskStatus ? (
            <p className="text-xs text-gray-500">Task status: {taskStatus}</p>
          ) : null}
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
      <TabBar />
    </div>
  );
}
