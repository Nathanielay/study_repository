'use client';

import Link from 'next/link';
import { useState } from 'react';

type WordItem = {
  wordId: string;
  headWord: string;
  wordRank: number;
  content: any;
};

function getPrimaryMeaning(content: any) {
  const trans =
    content?.word?.content?.trans ??
    content?.content?.word?.content?.trans ??
    content?.content?.trans;
  if (!Array.isArray(trans) || trans.length === 0) return '';
  const first = trans[0];
  const pos = first?.pos ? `${first.pos}. ` : '';
  const cn = first?.tranCn ?? '';
  return `${pos}${cn}`.trim();
}

export function LearningCard({
  bookId,
  initialWord,
}: {
  bookId: string;
  initialWord: WordItem | null;
}) {
  const [word, setWord] = useState<WordItem | null>(initialWord);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(!initialWord);

  async function handleNext() {
    if (!word || pending) return;
    setPending(true);

    try {
      await fetch('/api/me/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          wordId: word.wordId,
          wordRank: word.wordRank,
        }),
      });

      const response = await fetch(
        `/api/books/${bookId}/words?startRank=${word.wordRank}&limit=1`
      );
      const data = await response.json();
      const next = data?.words?.[0] ?? null;

      if (!next) {
        setWord(null);
        setDone(true);
      } else {
        setWord(next);
      }
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-lg font-semibold">You finished this book.</p>
        <p className="mt-2 text-sm text-gray-500">Pick another book to continue.</p>
      </div>
    );
  }

  if (!word) return null;

  const meaning = getPrimaryMeaning(word.content);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <Link
        href={`/word/${word.wordId}?from=/learn/${bookId}`}
        className="block text-center text-3xl font-semibold"
      >
        {word.headWord}
      </Link>
      <p className="mt-3 text-center text-sm text-gray-600">{meaning}</p>
      <button
        type="button"
        onClick={handleNext}
        disabled={pending}
        className="mt-6 w-full rounded-md border border-black bg-black px-4 py-2 text-sm font-semibold text-white"
      >
        {pending ? 'Loading...' : 'Next'}
      </button>
    </div>
  );
}
