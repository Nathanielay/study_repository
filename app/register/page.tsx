import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createUser, getUser } from 'app/db';
import { RegisterForm } from 'app/components/register-form';

export default function Register({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  async function register(formData: FormData) {
    'use server';
    let email = String(formData.get('email') ?? '').trim().toLowerCase();
    let password = String(formData.get('password') ?? '');
    let user = await getUser(email);

    if (user.length > 0) {
      redirect('/register?error=UserExists');
    } else {
      try {
        await createUser(email, password);
      } catch {
        redirect('/register?error=RegisterFailed');
      }
      redirect('/login');
    }
  }

  const errorMessage =
    searchParams?.error === 'UserExists'
      ? '该邮箱已注册。'
      : searchParams?.error === 'RegisterFailed'
        ? '注册失败，请稍后重试。'
        : undefined;

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
              创建你的学习账户
            </h1>
            <p className="mt-3 text-base text-slate-600">
              注册后即可记录学习进度，解锁持续学习体验。
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
              <h2 className="text-2xl font-semibold text-slate-900">注册</h2>
              <p className="mt-2 text-sm text-slate-500">
                使用邮箱快速创建账号
              </p>
            </div>
            <RegisterForm action={register} errorMessage={errorMessage} />
            <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
              <span>已有账号？</span>
              <Link href="/login" className="font-semibold text-slate-900">
                去登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
