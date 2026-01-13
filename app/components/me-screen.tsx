'use client';

import Link from 'next/link';

export function MeScreen({
  email,
  progress,
}: {
  email?: string | null;
  progress?: { bookTitle?: string; learnedCount?: number; totalWords?: number } | null;
}) {
  if (!email) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-base font-semibold">Please log in to continue</p>
        <p className="mt-2 text-sm text-gray-500">
          Log in to track progress across books.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/login"
            className="rounded-md border border-black bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800"
          >
            Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <p className="text-sm text-gray-500">Signed in as</p>
      <p className="text-base font-semibold">{email}</p>

      <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-700">Progress</p>
        <p className="mt-2 text-sm text-gray-600">
          {progress?.bookTitle ? `Current: ${progress.bookTitle}` : 'No recent study'}
        </p>
        {typeof progress?.learnedCount === 'number' ? (
          <p className="text-sm text-gray-600">
            Learned: {progress.learnedCount} / {progress?.totalWords ?? '-'}
          </p>
        ) : null}
      </div>
    </div>
  );
}
