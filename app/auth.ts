import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcrypt-ts';
import { getUser } from 'app/db';
import { authConfig } from 'app/auth.config';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize({ email, password }: any) {
        let normalizedEmail = String(email ?? '').trim().toLowerCase();
        let inputPassword = String(password ?? '');
        if (!normalizedEmail || !inputPassword) return null;

        let user = await getUser(normalizedEmail);
        if (user.length === 0) return null;
        if (!user[0]?.password) return null;
        let passwordsMatch =
          (await compare(inputPassword, user[0].password)) ||
          inputPassword === user[0].password;
        if (passwordsMatch) return user[0] as any;
        return null;
      },
    }),
  ],
});
