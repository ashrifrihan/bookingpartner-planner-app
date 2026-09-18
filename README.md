# BookingPartner Backend Planner

A simple installable website/PWA for the 12-week BookingPartner.lk backend schedule.

## What it includes

- Today, Tomorrow, This Week and All 12 Weeks views
- 84 daily task cards from 18 September to 10 December 2026
- Checkbox progress with overall and daily percentages
- Daily Notes and Blocked By fields
- Supabase email/password login
- Supabase Realtime sync across signed-in devices
- Row Level Security so one user cannot read another user's planner
- Local demo mode if no Supabase keys are configured
- Installable PWA support for desktop/Android and Add to Home Screen support on compatible mobile browsers

## Important security rule

The Supabase project URL and browser-safe anon/publishable key are meant to be used by a browser app. Your **service_role / secret key is NOT**. Never put a service-role key in `NEXT_PUBLIC_...`, GitHub, or browser code.

The SQL in `supabase/schema.sql` enables Row Level Security and only allows an authenticated user to access rows where `user_id` matches their login.

## 1. Start without Supabase (fastest)

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

With no `.env.local`, the app automatically uses Local Demo mode. Checkboxes/notes are saved in that browser with localStorage. Realtime sync is not available in Local Demo mode.

## 2. Connect Supabase for live sync

1. Create a Supabase project.
2. Open **SQL Editor** in the Supabase dashboard.
3. Copy everything from `supabase/schema.sql` and run it once.
4. In Supabase project settings/API, copy your project URL and browser-safe anon/publishable key.
5. Copy `.env.local.example` to `.env.local`.
6. Paste the two browser-safe values:

```env
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_BROWSER_SAFE_ANON_OR_PUBLISHABLE_KEY"
```

7. Restart Next.js:

```bash
npm run dev
```

The app will now show a sign-in/create-account page. After login it automatically inserts the 12-week checklist for that account and subscribes to realtime database changes.

## 3. Supabase Auth setting

The app uses email + password. Supabase projects can require email confirmation depending on your Auth settings. If confirmation is enabled, create the account, confirm the email, then sign in.

For a private personal planner, keep public signups disabled after your own account is created if you do not want other people creating accounts.

## 4. Install it like an app

Run it from HTTPS in production (for example on Vercel). On supported browsers, press **Install app**. On browsers that do not expose an install popup, use the browser menu and choose **Install app** or **Add to Home Screen**.

The included service worker caches the same-origin app shell. Cloud changes still require a network connection, while previously loaded app pages have basic offline fallback.

## 5. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import it in Vercel.
3. In Vercel project settings, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. Open the HTTPS URL and test sign-in, checkbox sync, notes and installation.

## 6. Test realtime

1. Sign in on laptop browser A.
2. Sign in with the same account on phone/browser B.
3. Open Today on both.
4. Check a task on A.
5. It should update on B without refresh after Supabase Realtime delivers the database event.

## Files to know

- `components/Dashboard.tsx` — planner UI, login, local storage, realtime syncing
- `lib/plan.ts` — all 84 days and checklist text
- `lib/supabase.ts` — browser Supabase client
- `supabase/schema.sql` — tables, RLS policies, realtime publication
- `public/sw.js` — PWA service worker
- `app/manifest.ts` — installable-app manifest
- `.env.local.example` — environment variable template

## Production notes

- Do not use an open RLS policy like `using (true)` for private planner data.
- Do not expose a Supabase service-role key.
- Keep your real BookingPartner payment/database secrets in server-only environment variables; this planner app only needs the Supabase browser key.
- If you later want team sharing, add an explicit `workspace_id`/membership model instead of making planner rows public.
