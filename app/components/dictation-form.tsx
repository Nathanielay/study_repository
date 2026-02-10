'use client';

import { useState } from 'react';

export function DictationForm({ articleId }: { articleId: number }) {
  const [inputText, setInputText] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [diffHtml, setDiffHtml] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setScore(null);
    setDiffHtml(null);
    setErrors([]);

    let response = await fetch('/api/dictations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, inputText }),
    });
    let data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setErrors([data?.error ?? 'Failed to score']);
      return;
    }
    setScore(data.score ?? null);
    setDiffHtml(data.diffHtml ?? null);
    setErrors(Array.isArray(data.errors) ? data.errors : []);
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          className="w-full rounded-lg border border-gray-200 p-3 text-sm"
          rows={10}
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder="Type the full passage here."
        />
        <button
          type="submit"
          className="rounded-md border border-black px-4 py-2 text-sm font-semibold"
          disabled={loading}
        >
          {loading ? 'Scoring...' : 'Submit'}
        </button>
      </form>

      {score !== null ? (
        <div className="mt-4 space-y-2 text-sm">
          <p className="font-semibold">Score: {score}</p>
          {diffHtml ? (
            <div
              className="rounded-lg border border-gray-200 p-3"
              dangerouslySetInnerHTML={{ __html: diffHtml }}
            />
          ) : null}
          {errors.length > 0 ? (
            <div>
              <p className="font-semibold">Errors</p>
              <ul className="list-disc pl-5 text-xs text-gray-600">
                {errors.map((word) => (
                  <li key={word}>{word}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
