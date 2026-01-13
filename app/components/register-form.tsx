'use client';

import { useFormStatus } from 'react-dom';

export function RegisterForm({
  action,
  errorMessage,
}: {
  action: (formData: FormData) => void;
  errorMessage?: string;
}) {
  return (
    <form action={action} className="flex flex-col space-y-4">
      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
      <div>
        <label htmlFor="email" className="block text-xs font-medium text-slate-600 uppercase">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="user@acme.com"
          autoComplete="email"
          required
          className="mt-1 block w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-xs font-medium text-slate-600 uppercase">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 block w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type={pending ? 'button' : 'submit'}
      aria-disabled={pending}
      className="flex h-11 w-full items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
    >
      {pending ? '注册中...' : '注册'}
    </button>
  );
}
