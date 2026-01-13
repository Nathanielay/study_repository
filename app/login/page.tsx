import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Form } from 'app/form';
import { signIn } from 'app/auth';
import { SubmitButton } from 'app/submit-button';

export default function Login({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  let errorMessage =
    searchParams?.error === 'CredentialsSignin'
      ? '登录失败，请检查邮箱或密码。'
      : searchParams?.error
        ? '登录失败，请稍后重试。'
        : undefined;
  let redirectTo = '/me';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-slate-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-10 top-8 h-48 w-48 rounded-full bg-amber-200/50 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-16 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-center">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Word Learning
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
              欢迎回来
            </h1>
            <p className="mt-3 text-base text-slate-600">
              继续你的学习进度，用更短的时间掌握更多单词。
            </p>
            <div className="mt-6" />
          </div>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-8 backdrop-blur">
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <Link href="/" className="flex items-center gap-2 text-slate-600">
                  <span aria-hidden="true">←</span>
                  返回
                </Link>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">登录</h2>
              <p className="mt-2 text-sm text-slate-500">
                使用邮箱和密码进入你的账户
              </p>
            </div>
            <Form
              action={async (formData: FormData) => {
                'use server';
                try {
                  await signIn('credentials', {
                    redirectTo,
                    email: formData.get('email') as string,
                    password: formData.get('password') as string,
                  });
                } catch {
                  redirect(`/login?error=CredentialsSignin&redirect=${encodeURIComponent(redirectTo)}`);
                }
              }}
            >
              {errorMessage ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </p>
              ) : null}
              <SubmitButton>登录</SubmitButton>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>没有账号？</span>
                <Link href="/register" className="font-semibold text-slate-900">
                  去注册
                </Link>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
