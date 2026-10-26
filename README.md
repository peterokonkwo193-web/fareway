# Fareway

Flight comparison and booking-request website. Visitors search flights between any countries, cities or airports in the world, pick a flight and send a **booking request**. **No payment is taken on the site.** Customers then contact the customer care team (WhatsApp, phone, email) with their reference number; care confirms the price, takes payment and completes the booking.

- Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix)
- Zustand (search state) · TanStack Query · Zod · React Hook Form · date-fns · Lucide
- Prisma 7 + SQLite (Postgres-ready) · Auth.js (NextAuth v5) for the admin area
- next-intl (English, ready for more languages)
- Vitest + Playwright

---

## Contents

1. [Quick start](#quick-start)
2. [Scripts](#scripts)
3. [Environment variables](#environment-variables)
4. [How booking requests work](#how-booking-requests-work)
5. [Project structure](#project-structure)
6. [Data: countries, airports, currencies](#data-countries-airports-currencies)
7. [Flight data provider (and swapping in Amadeus or Duffel)](#flight-data-provider)
8. [Email (mock, Resend, SendGrid)](#email)
9. [Admin area](#admin-area)
10. [Security and privacy](#security-and-privacy)
11. [Languages (i18n)](#languages-i18n)
12. [Testing](#testing)
13. [Deploying to Vercel](#deploying-to-vercel)
14. [Known limitations](#known-limitations)
15. [Credits and licences](#credits-and-licences)

---

## Quick start

Requirements: Node.js 20.9+ (developed on Node 24) and npm.

```bash
npm install                      # also generates the Prisma client
cp .env.example .env             # Windows PowerShell: Copy-Item .env.example .env
```

Edit `.env`:

1. `AUTH_SECRET`: any long random string, for example the output of `openssl rand -base64 32`.
2. `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`: run `npm run admin:hash -- "a long unique password"` and paste the `.env` line it prints. Every `$` must stay escaped as `\$` (Next.js expands `$` in `.env` values).
3. `CUSTOMER_CARE_*`: your real phone, WhatsApp number (digits only, with country code), email, hours and response time.

Then:

```bash
npx prisma migrate dev           # creates prisma/dev.db
npm run db:seed                  # optional: 8 demo requests for the admin area
npm run dev                      # http://localhost:3000
```

- Admin area: <http://localhost:3000/admin> (sign in with `ADMIN_EMAIL` and your password).
- Emails are written to `.mail-outbox/` while `MAIL_PROVIDER="mock"`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Builds, then runs Playwright end-to-end tests (desktop + mobile) against a separate `prisma/e2e.db` |
| `npm run db:migrate` | Create/apply migrations in development |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Demo booking requests (re-runnable) |
| `npm run admin:hash -- "password"` | bcrypt hash for `ADMIN_PASSWORD_HASH` |
| `npm run data:geo` | Rebuild `data/countries.json` and `data/airports.json` (add `-- --fresh` to re-download OurAirports) |
| `npm run data:fx` | Refresh indicative exchange rates |

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes (prod) | Public URL, used in metadata, sitemap and email links |
| `DATABASE_URL` | yes | `file:./prisma/dev.db` locally; a Postgres URL in production |
| `CUSTOMER_CARE_PHONE` | yes | Shown and used for `tel:` links, international format |
| `CUSTOMER_CARE_WHATSAPP` | yes | Digits only with country code (for `wa.me` links) |
| `CUSTOMER_CARE_EMAIL` | yes | Shown, used for `mailto:` links and as reply-to on emails |
| `CUSTOMER_CARE_HOURS` | yes | e.g. `Every day, 08:00–22:00 (UTC)` |
| `CUSTOMER_CARE_RESPONSE_TIME` | no | e.g. `We usually reply within 1 hour.` |
| `ADMIN_EMAIL` | yes | Staff login email |
| `ADMIN_PASSWORD_HASH` | yes | bcrypt hash (`npm run admin:hash`); escape `$` as `\$` in `.env`, paste unescaped in Vercel |
| `AUTH_SECRET` | yes | Secret for admin session cookies and booking access cookies |
| `MAIL_PROVIDER` | no | `mock` (default), `resend` or `sendgrid` |
| `MAIL_FROM` | with real mail | e.g. `Fareway <bookings@yourdomain.com>` (verified sender) |
| `RESEND_API_KEY` / `SENDGRID_API_KEY` | with that provider | API key |
| `FLIGHT_PROVIDER` | no | `mock` (default) |
| `CRON_SECRET` | yes (prod) | Protects `/api/cron/expire`; Vercel Cron sends it automatically |

Customer care details are read at request time, so you can change them in Vercel without code changes (redeploy to apply).

## How booking requests work

1. The visitor searches (`/`), compares results (`/flights`), opens a flight (`/flights/[id]`) and clicks **Request this flight**.
2. `/book/[id]` collects the lead traveller's full name as on the passport, email and phone (with country dialling code), and for each passenger the name, date of birth and passport nationality, plus optional notes. The form is validated with the same Zod schema in the browser and on the server (`src/lib/booking/schema.ts`), including age rules at the travel date.
3. `POST /api/bookings`:
   - re-fetches the offer from the flight provider, so the price comes from the server and never from the browser;
   - saves a `BookingRequest` with a reference such as `FW-261014-AB3CD`, the full flight snapshot, passengers, quoted price and currency, and status **Pending**;
   - emails the customer a confirmation.

   **No payment is requested.**
4. `/booking/[reference]` shows the required message ("Your request is saved. To confirm your booking and pay, contact our customer care team and quote your reference number."), the reference with a copy button, the status and the flight summary. It also shows WhatsApp, phone and email buttons prefilled with the reference and flight, a live chat placeholder, working hours and the price notices.
5. Customers can come back through `/booking/lookup` with reference and email. A booking page is only shown to a browser that created the request or verified it this way (a signed, httpOnly cookie per booking), so a guessed reference reveals nothing.

**Statuses:** Pending → Contacted → Awaiting payment → Confirmed, plus Cancelled and Expired. Allowed transitions are in `src/lib/booking/status.ts`.

**Expiry:** requests still Pending after 48 hours become Expired whenever they are read and through `/api/cron/expire` (Vercel Cron, see `vercel.json`).

There is no payment gateway, card form or payment SDK anywhere in the project. Copy on the site and in emails tells customers we never ask for card details by email or chat.

## Project structure

```
data/                    countries, airports, airlines, metro codes, FX rates, featured destinations (+ README)
design-reference/        the original Stitch mockups and DESIGN.md
messages/en.json         UI strings (next-intl)
prisma/                  schema, migrations, seed
scripts/                 data builders, password hash
src/
  app/
    (site)/              public pages: home, flights, flights/[id], explore, book/[id],
                         booking/[reference], booking/lookup, contact, faq, about, terms, privacy, data-request
    admin/               login, (panel)/dashboard, bookings, bookings/[reference], deletion-requests, server actions
    api/                 places, flights/search, bookings, bookings/lookup, alerts, data-requests,
                         admin/export, cron/expire, auth/[...nextauth]
    sitemap.ts robots.ts opengraph-image.tsx
  auth.ts                Auth.js config (admin)
  components/            ui/ (shadcn), layout/, search/, results/, flight/, booking/, explore/, home/, admin/, legal/
  content/en/legal.ts    Terms, Privacy, About, FAQ text (per locale)
  generated/prisma/      generated Prisma client (git-ignored)
  i18n/                  next-intl config (cookie-based locale)
  lib/
    flights/             provider interface, MockProvider, filter, sort, fare, deals, explore
    geo/                 geo index + fuzzy place search, distance, default origin
    booking/             reference, schema, status, service, access cookie, contact links
    mail/                Mailer interface, mock/Resend/SendGrid, templates
    security/            rate limit, CSRF origin check, honeypot, guard
    admin/               admin queries, CSV, auth guard
    currency/            currencies, conversion, formatting
    search/              search query schema + URL format
  stores/search-store.ts Zustand store (draft search, recent searches)
tests/unit, tests/e2e
```

## Data: countries, airports, currencies

- `data/countries.json` holds 250 entries:
  - all 193 UN members, the observer states Vatican City and Palestine, partially recognised states and ISO territories;
  - for each: name, ISO alpha-2/alpha-3, continent, capital, currency (code, name, symbol), dialling code and flag emoji;
  - places without their own airport (Monaco, Vatican City, Andorra…) list their nearest airports.
- `data/airports.json` holds about 3,200 airports from OurAirports: every large and medium airport with an IATA code and scheduled service, plus small ones for countries that would otherwise have none.
- Refresh both with `npm run data:geo -- --fresh`. Details are in [`data/README.md`](data/README.md).
- The currency selector lists every currency in the countries file. Prices are converted from USD with `data/fx-rates.json` (`npm run data:fx`). Currencies without a published rate show USD prices and say so.
- The datasets are only loaded on the server (`src/lib/geo/data.ts` is `server-only`). Autocomplete goes through `/api/places`.

## Flight data provider

All flight data goes through one interface (`src/lib/flights/types.ts`):

```ts
interface FlightProvider {
  readonly name: string;
  search(query: SearchQuery): Promise<FlightOffer[]>;
  getOffer(id: string): Promise<FlightOffer | null>;   // re-price before saving a request
  estimate(fromIata: string, toIata: string, date: string): Promise<PriceEstimate | null>; // Explore + home deals
}
```

`createProvider()` in `src/lib/flights/provider.ts` picks the implementation from `FLIGHT_PROVIDER`.

**MockProvider** (`src/lib/flights/mock-provider.ts`) generates realistic, deterministic flights between any two airports in the dataset:
- **Routes:** direct flights where plausible, otherwise one stop through real carrier hubs, or two stops for remote airports. Legs stay under 14,000 km.
- **Durations and layovers:** durations come from great-circle distance; layovers run from 55 minutes to overnight.
- **Prices:** they vary with distance, cabin, booking window, weekday, season and carrier type.
- **Extras:** baggage allowances and fare rules are included.
- **Stable links:** offer ids encode the search, so links work without storing results.

**Swapping in a real provider (Amadeus or Duffel):**

1. Create `src/lib/flights/amadeus-provider.ts` (or `duffel-provider.ts`) that implements `FlightProvider`:
   - `search`: map `SearchQuery` to the API's offer search (Amadeus *Flight Offers Search*, or a Duffel *offer request*). Resolve place ids with `geo.resolvePlace(id).airports` (countries and cities become several airports), then map each result to `FlightOffer`. Keep the provider's offer id inside your `id` so `getOffer` can find it.
   - `getOffer`: re-price the offer (Amadeus *Flight Offers Price*, or Duffel *get offer*). Return `null` if it is gone.
   - `estimate`: use a cheap endpoint (Amadeus *Flight Cheapest Date Search*) or cache results. Explore calls it for about 240 countries per origin and month, so cache aggressively.
2. Register it in `createProvider()`, add the API keys to `.env`, and set `FLIGHT_PROVIDER=amadeus`.
3. Respect the provider's rate limits and terms. Fareway never takes payment, so you only need search and pricing scopes. Booking and ticketing are done by customer care in your own back-office tools.

The UI only uses `FlightOffer`, so nothing else changes.

## Email

`src/lib/mail/mailer.ts` defines a small `Mailer` interface:

- **`mock`** (default) writes each email as HTML to `.mail-outbox/` and logs only the subject. Personal data never goes to logs.
- **Resend:** set `MAIL_PROVIDER=resend`, `RESEND_API_KEY` and a verified `MAIL_FROM`.
- **SendGrid:** set `MAIL_PROVIDER=sendgrid`, `SENDGRID_API_KEY` and a verified `MAIL_FROM`.

Both real adapters call the providers' HTTP APIs directly, so no SDK is needed. To add another provider, implement `Mailer` and register it in `getMailer()`. Templates are in `src/lib/mail/templates.ts`. A mail failure never loses a saved request.

## Admin area

`/admin` is for customer care staff:

- **Sign-in:** Auth.js credentials provider with one account from env vars, a bcrypt hash, an 8-hour JWT session and a login rate limit.
- **Dashboard:** counts by status, requests about to expire, latest requests and open deletion requests.
- **Requests table:** search (reference, name, email, phone, airport), filters (status, destination country, created date range), sortable columns, pagination, and **CSV export** with the same filters. Cells are neutralised against spreadsheet formula injection.
- **Request detail:** contact shortcuts, passengers, customer notes, the full flight snapshot, status changes (only valid transitions), history and internal notes.
- **Data deletion:** review requests from `/data-request` and delete every request and alert for that email.

Every admin page, server action and admin API checks the session on the server. Admin pages are `noindex` and disallowed in `robots.txt`. No card data is collected or displayed anywhere.

## Security and privacy

- **Validation:** Zod schemas validate on the client and the server (search, booking, lookup, alerts, deletion, admin actions).
- **CSRF:** public JSON endpoints require a same-origin `Origin`/`Referer` and `Content-Type: application/json`. Server Actions and Auth.js have their own CSRF protection.
- **Rate limiting:** a sliding window per IP on bookings, lookup, alerts and deletion requests, and per email on admin login (`src/lib/security/rate-limit.ts`).
- **Honeypot:** forms include a hidden field, and filled submissions are silently dropped.
- **Passwords:** the admin password is stored only as a bcrypt hash.
- **Logging:** personal and passport data never goes to logs. Errors log only types or digests, and the mock mailer logs only subjects.
- **Booking access:** pages require a signed access cookie (reference plus email lookup).
- **Data minimisation:** no passport numbers and no payment data.
- **Cookie notice:** essential cookies only, listed in the privacy policy.
- **Data deletion:** GDPR-style deletion through `/data-request` and the admin review screen.
- **Headers:** `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy and a restrictive `Permissions-Policy`.
- **Legal pages:** Terms (`/terms`) and Privacy (`/privacy`) are written for the request-only model. **Have them reviewed by a lawyer and add your company details before launch** (`src/content/en/legal.ts`).

## Languages (i18n)

- **Where strings live:** UI strings are in `messages/en.json`, and long-form pages are in `src/content/en/legal.ts`. The admin area is English-only (internal tool).
- **How the locale is chosen:** it comes from the `fw_locale` cookie (language menu in the header), so URLs stay `/flights`, `/explore`, etc.

To add French:

1. Copy `messages/en.json` to `messages/fr.json` and translate it.
2. Add `"fr"` to `locales` and `localeLabels` in `src/i18n/config.ts`.
3. Add `src/content/fr/legal.ts` and register it in `src/content/index.ts`.

To switch to `/fr/...` URLs later, move to next-intl's routing middleware. Pages already read the locale through next-intl.

## Testing

```bash
npm test            # 67 unit tests
npm run test:e2e    # Playwright: search → details → request → confirmation → lookup (desktop + mobile),
                    # honeypot and cross-site request checks
```

- **Unit tests** cover filtering, sorting, reference generation, the search query schema, the booking schema (ages, names, phone), the geo index (every country reachable, fuzzy search), MockProvider invariants and CSV safety.
- **End-to-end tests** run against a production build on port 3200 with `prisma/e2e.db`. To run them by hand: `npx next build && npx playwright test`. First run: `npx playwright install chromium`.

## Deploying to Vercel

SQLite files do not persist on Vercel, so production uses Postgres (for example Neon or Vercel Postgres).

1. **Switch Prisma to Postgres**
   - In `prisma/schema.prisma` set `provider = "postgresql"`.
   - `npm install @prisma/adapter-pg pg`.
   - In `src/lib/db.ts` replace the SQLite adapter:
     ```ts
     import { PrismaPg } from "@prisma/adapter-pg";
     const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
     ```
   - Recreate migrations for Postgres: delete `prisma/migrations`, point `DATABASE_URL` at a Postgres database and run `npx prisma migrate dev --name init`. Commit the new migrations.
2. **Create the Vercel project** from your Git repository. Framework: Next.js.
   - Build command: `prisma migrate deploy && next build`.
   - Install command: default (`npm install` runs `prisma generate`).
3. **Environment variables:** add everything from the table above to Production (and Preview if wanted).
   - Use the **unescaped** bcrypt hash in Vercel.
   - Set `NEXT_PUBLIC_SITE_URL` to your domain.
   - Set a random `CRON_SECRET` and `AUTH_SECRET`.
4. **Cron:** `vercel.json` schedules `/api/cron/expire` daily, which is the Hobby plan limit. On Pro, change it to hourly (`0 * * * *`). Requests also expire whenever they are read, so statuses are always correct when viewed.
5. **Rate limiting:** the built-in limiter is in-memory and per instance. For a shared limit across Vercel instances, implement `RateLimitStore` with Upstash Redis (`@upstash/ratelimit`) in `src/lib/security/rate-limit.ts`.
6. **Email:** set `MAIL_PROVIDER` to `resend` or `sendgrid`. The mock mailer cannot write files on Vercel, so it only logs subjects.
7. **Domain:** add your domain in Vercel and update `NEXT_PUBLIC_SITE_URL`.

## Known limitations

- **Flight data is mock data.** Routes, schedules and prices are generated. Local times use approximate UTC offsets (longitude plus country overrides, no daylight saving). A real provider returns real local times.
- **Price alerts are stored but not sent.** Sending them needs a real price source and a scheduled job: compare `PriceAlert.maxPrice` with fresh quotes and email using `unsubscribeToken`.
- **Live chat is a placeholder.** It suggests WhatsApp and email until a chat tool is connected.
- **Lighthouse (local, production build):**

  | Pages | Profile | Performance | Accessibility | Best practices | SEO |
  |---|---|---|---|---|---|
  | Home, FAQ, Explore | Desktop | 89–97 | 100 | 100 | 100 |
  | Home, FAQ, Explore | Mobile | 62–72 | 100 | 100 | 100 |

  - The development machine is slow by Lighthouse's own CPU benchmark (index 650–1,200, against ~1,500+ typical), which inflates mobile blocking time under the 4× CPU throttle.
  - Re-measure on the deployed site with PageSpeed Insights.
  - If mobile performance is still under 90 there, the next steps are inlining critical CSS and trimming the heavier `:has()`-based shadcn variants. The first-visit cookie notice is currently the mobile LCP element.
  - Results pages are intentionally `noindex`, which lowers their SEO score.

## Credits and licences

- **Airports:** [OurAirports](https://ourairports.com/data/), public domain.
- **Countries:** [mledoze/countries](https://github.com/mledoze/countries) via `world-countries`, ODbL-1.0.
- **Flag glyphs:** [Twemoji](https://github.com/jdecked/twemoji) country flags font, CC-BY 4.0.
- **Exchange rates:** [open.er-api.com](https://www.exchangerate-api.com/docs/free), indicative only.
- **Destination images:** from the project's own Stitch design mockups (`design-reference/`).
- **Logo and branding:** original to Fareway. Airline names appear as text only, with no third-party logos.
