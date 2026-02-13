 'use client';

import { useRouter } from 'next/navigation';

export function BackButton({ label = 'Back' }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="text-sm font-semibold text-gray-600"
    >
      {label}
    </button>
  );
}
