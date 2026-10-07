# Avans ICT Alumni Showcase

A showcase for Avans ICT alumni: alumni submit a case (image, links, short description), an admin reviews it, and the site turns the approved cases into a gallery plus an overview of the companies where alumni work. Dutch by default, with an English switcher (`NL | EN`).

**Stack:** Nuxt 4 · Supabase (Postgres, Auth, Storage) · Tailwind CSS 4 · Zod. The visual language (palette, Sofia Sans / Hanken Grotesk, oversized corners, pill buttons) is borrowed from avans.nl.

## How it works

| Piece | What it does |
| --- | --- |
| `/` | Hero, company ticker, stats, filterable showcase grid, **company overview distilled from the showcases**. |
| `/showcase/:slug` | Case detail with all links, the alumnus and their preferred contact. |
| `/submit` | Submission form with live preview, drag & drop image (shrunk to WebP in the browser), multiple links, tags. |
| `/login`, `/admin` | Magic-link sign-in and moderation (approve / reject / feature / delete) for the admin. |
| `POST /api/submissions` | Validates with the same Zod schema as the form, sniffs the image bytes, rate-limits, then stores image + row with the service key. |

### Privacy: who sees the contact email?

* The alumnus' **email is never shown publicly.** It lives in its own table, `showcase_contacts`, which has **no public policy**: only an admin can read it (Row Level Security).
* On the site, an alumnus can share a *preferred contact link* (LinkedIn or website). It is **optional**: without a link (or with the email option), visitors get a **Request an intro** button that mails the admin address instead.
* Admins see the private email in `/admin` and on the case page, **hidden behind a reveal button** by default.
* Admin = a **confirmed** email on the `public.admins` allow-list (seeded with `s.vandockum@avans.nl`). The database decides, not the client. To add admins, insert into that table.
* Submissions start as `pending` and only appear after approval. Spam defences: server-side validation, image type sniffing + 5 MB cap, per-IP rate limit (in memory, per instance), honeypot and time-to-fill check.

## Getting started

```bash
npm install
cp .env.example .env     # fill in the values of your Supabase project
npm run dev              # http://localhost:3000
```

### Supabase project

The repo is linked to the Supabase project `alumnishowcase`. The schema is in [`supabase/migrations`](supabase/migrations):

```bash
npm run db:push          # apply migrations to the linked project (no demo data)
```

Then, once:

1. **Create the admin user** (Dashboard → Authentication → Users → *Add user*, with *Auto Confirm* ticked) for `s.vandockum@avans.nl`. Sign-in deliberately does not create accounts, so strangers cannot trigger sign-in emails.
2. **Auth → URL Configuration:** set the *Site URL* to your production URL and add `https://<your-domain>/confirm` (and `http://localhost:3000/confirm`) to *Redirect URLs*.
3. Optional hardening: Auth → Sign In / Providers → Email, switch off *Allow new users to sign up*. The admin user already exists and the site never needs public accounts.
4. Environment variables for hosting: `SUPABASE_URL`, `SUPABASE_KEY` (publishable/anon) and `SUPABASE_SECRET_KEY` (or the legacy `SUPABASE_SERVICE_KEY`). The service key is **server only**.

### Deploying (Vercel)

Set these in *Project → Settings → Environment Variables* for **Production** (and Preview if you use it), then **redeploy**. Vercel only applies new or changed variables to new deployments, so adding one to a live deployment changes nothing until you redeploy.

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_KEY` | publishable (anon) key |
| `SUPABASE_SECRET_KEY` | secret key. The legacy `service_role` key also works as `SUPABASE_SERVICE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`. |

The server key is read when a request arrives, so it never ends up in the build. If submitting fails, check *Deployments → Logs* for a line starting with `[supabase] Cannot create the admin client`; it names the variables it looks for. Uploads are capped at 4 MB because Vercel rejects request bodies over about 4.5 MB.

### Local Supabase (with demo data)

Needs Docker and a recent Supabase CLI (`brew upgrade supabase`; CLI 2.54 pairs mismatched local images and breaks Storage uploads).

```bash
npm run db:start         # starts the stack, applies migrations and supabase/seed.sql
npm run dev:local        # Nuxt against the local stack
```

Local ports are `56321+` to avoid clashing with other projects. Sign-in emails land in Mailpit at http://127.0.0.1:56324. Create the local admin user once:

```bash
curl -X POST http://127.0.0.1:56321/auth/v1/admin/users \
  -H "apikey: $(supabase status -o env | sed -n 's/^SECRET_KEY="\(.*\)"/\1/p')" \
  -H "Content-Type: application/json" \
  -d '{"email":"s.vandockum@avans.nl","email_confirm":true}'
```

After changing the schema, regenerate the typed client: `npm run db:types`.

## Languages

Dutch is the source of truth ([`app/locales/nl.ts`](app/locales/nl.ts)); [`en.ts`](app/locales/en.ts) must have the same shape (enforced by TypeScript). Use `$t('key')` in templates and `t('key')` from `useLocale()` in scripts. The choice is stored in a cookie so server-rendered HTML already matches, and `?lang=en` makes a language linkable. Validation messages are keys (`errors.*`), shared by the form and the server.

## Motion

Kinetic headline masks, a fanning hero card deck, count-up stats, a company ticker, scroll reveals (`v-reveal`), FLIP-animated filtering, shared-element view transitions between grid and case page, and a scroll progress bar. Everything respects `prefers-reduced-motion`.

## Scripts

`dev` · `dev:local` · `build` · `preview` · `typecheck` · `db:start` / `db:stop` / `db:reset` / `db:push` / `db:types`
