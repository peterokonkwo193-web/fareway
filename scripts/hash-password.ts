/**
 * Prints a bcrypt hash for ADMIN_PASSWORD_HASH.
 *   npm run admin:hash -- "a long unique password"
 *
 * Next.js expands "$" in .env values (even inside quotes), so the hash is printed
 * with every "$" escaped as "\$", ready to paste into .env. In the Vercel dashboard,
 * paste the unescaped hash (second line) instead.
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: npm run admin:hash -- "password (at least 12 characters)"');
  process.exit(1);
}
const hash = bcrypt.hashSync(password, 12);
console.log(`.env:   ADMIN_PASSWORD_HASH="${hash.replace(/\$/g, "\\$")}"`);
console.log(`Vercel: ${hash}`);
