'use client';

import { useState } from 'react';

export function DictationForm({ articleId }: { articleId: number }) {
  const [inputText, setInputText] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [referenceHtml, setReferenceHtml] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [spellingCount, setSpellingCount] = useState<number | null>(null);
  const [missingCount, setMissingCount] = useState<number | null>(null);
  const [extraCount, setExtraCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setScore(null);
    setReferenceHtml(null);
    setErrors([]);
    setAnalysis(null);
    setSpellingCount(null);
    setMissingCount(null);
    setExtraCount(null);

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
    setReferenceHtml(data.referenceHtml ?? null);
    setErrors(Array.isArray(data.errors) ? data.errors : []);
    setAnalysis(data.analysis ?? null);
    setSpellingCount(Number.isFinite(data.spellingCount) ? data.spellingCount : null);
    setMissingCount(Number.isFinite(data.missingCount) ? data.missingCount : null);
    setExtraCount(Number.isFinite(data.extraCount) ? data.extraCount : null);
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
          {spellingCount !== null ? (
            <p className="text-xs text-gray-600">
              Errors: {(spellingCount ?? 0) + (missingCount ?? 0)} · Spelling:{' '}
              {spellingCount} · Missing: {missingCount ?? 0} · Extra:{' '}
              {extraCount ?? 0}
            </p>
          ) : null}
          {referenceHtml ? (
            <div
              className="rounded-lg border border-gray-200 p-3"
              dangerouslySetInnerHTML={{ __html: referenceHtml }}
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
          {analysis ? (
            <div className="rounded-lg border border-gray-200 p-3 text-xs text-gray-700 whitespace-pre-wrap">
              <p className="font-semibold text-sm">LLM Analysis</p>
              <p className="mt-2">{analysis}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
