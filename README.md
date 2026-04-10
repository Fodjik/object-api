# Object storage app

Node (Express) API on [Render](https://render.com) with a Postgres backend on [Supabase](https://supabase.com). Users sign in with Supabase Auth (Google). Data is protected with Row Level Security (RLS); the API forwards each user’s JWT so queries run as that user. Admin actions use the **service role** key only on the server.

## Features

- **Objects** — dimensions, surface, **material** (reusable catalog + description shown in the storage table), **location** (your own named locations, not only A/B/C).
- **QR codes** — encode a link to a **public** read-only detail page (`GET /api/public/objects/:id`) so scanners do not need to log in.
- **Approval workflow** — new users have `is_approved = false` until an admin approves them in `/admin`.
- **Admin panel** — list users, approve, grant admin, delete auth users (requires service role on the server).

## Environment variables (Render + local)

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Anon key; exposed via `GET /api/config` for the browser and used to validate JWTs |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — public object API, user listing, profile updates for other users, `auth.admin.deleteUser` |
| `PORT` | Optional; Render sets this automatically |

Copy `.env.example` to `.env` for local runs.

## Supabase setup

1. **Auth → Providers** — enable Google (or others) and add redirect URLs, e.g. `https://<your-service>.onrender.com/login` and `http://localhost:3000/login`.
2. **SQL** — run `supabase/schema.sql` in the SQL editor.
3. **First admin** — after you sign in once, run (replace email):

   ```sql
   update public.profiles
   set is_approved = true, is_admin = true
   where email = 'you@example.com';
   ```

4. **Existing `objects` table** — if you already had an old `objects` shape (`location` text, no `user_id`), back up data and migrate manually before relying on the new API. The provided script targets a **fresh** schema.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000` — you should be redirected to `/login` until signed in.

## Before you commit (GitHub)

- Confirm **`.env` is not tracked** (`git status` should not list it; it is in `.gitignore`).
- Copy **`.env.example`** → `.env` locally only; put real keys on **Render**, not in the repo.
- Run `node --check server.js` after edits to catch syntax errors.
- Optional: `npm install` then `npm start` and smoke-test login, storage list, and `/object/<uuid>` with a valid id.

## Project layout

- `server.js` — Express API, auth middleware, admin routes.
- `public/` — main UI (`index.html`), object details for QR.
- `login.html`, `admin.html`, `register.html` — served from the repo root via explicit routes.
- `supabase/schema.sql` — tables, RLS, signup trigger.

## Security notes

- Do not commit `.env` or the service role key.
- RLS policies restrict `locations`, `materials`, and `objects` to the owning `user_id` (set by the API from the JWT).
- The anon key is public by design; real protection is RLS + validating JWTs on protected routes.
