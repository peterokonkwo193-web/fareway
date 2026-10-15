import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rateLimit } from "@/lib/security/rate-limit";

/**
 * Admin authentication for customer care (/admin).
 * One staff account from env vars: ADMIN_EMAIL + ADMIN_PASSWORD_HASH (bcrypt).
 * Generate a hash with: npm run admin:hash -- "your-password"
 */

class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}

const credentialsSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  logger: {
    // Wrong passwords are expected; don't fill logs with their stack traces.
    error(error) {
      if (error.name === "CredentialsSignin" || (error as { type?: string }).type === "CredentialsSignin") return;
      console.error("[auth]", error.name, error.message);
    },
  },
  providers: [
    Credentials({
      name: "Staff login",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase();

        const limit = await rateLimit(`admin-login:${email}`, 8, 15 * 60 * 1000);
        if (!limit.ok) throw new TooManyAttempts();

        const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
        const hash = process.env.ADMIN_PASSWORD_HASH ?? "";
        if (!adminEmail || !hash) return null;

        // Always run bcrypt so response time does not reveal whether the email matched.
        const passwordOk = await bcrypt.compare(parsed.data.password, hash);
        if (email !== adminEmail || !passwordOk) return null;
        return { id: "admin", email: adminEmail, name: "Customer care" };
      },
    }),
  ],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
});
