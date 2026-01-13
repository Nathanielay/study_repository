'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TabBar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isMe = pathname.startsWith('/me');

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-screen-sm items-center justify-around py-3 text-sm">
        <Link
          href="/"
          className={isHome ? 'text-black font-semibold' : 'text-gray-500'}
        >
          Home
        </Link>
        <Link
          href="/me"
          className={isMe ? 'text-black font-semibold' : 'text-gray-500'}
        >
          Me
        </Link>
      </div>
    </nav>
  );
}
