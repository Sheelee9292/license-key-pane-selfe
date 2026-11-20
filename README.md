# Mr. Shakeel — License Bureau (v2.5.8)

100% **free** license-key management panel + Android integration for the
**Mr. Shakeel** Android app. Manage everything from your phone browser — no
paid server, no paid hosting, no subscriptions.

- **Master Owner** has supreme control over every reseller and every key
- **Resellers / sub-users** get their own login and can issue keys for their
  own customers (with an optional key cap you set)
- Plans: **3 Days**, **1 Month (30 days)**, **3 Months (90 days)**
- Keys can be bound to a customer **Device ID**, with Active / Expired /
  Revoked states and full expiry tracking
- Public `POST /api/verify` endpoint used by the Android app

---

## 1. Free database (2 minutes)

1. Go to **neon.tech** (or **supabase.com**) and sign in with GitHub.
2. **Create project** → any name → region closest to you → **Create**.
3. Copy the **PostgreSQL connection string**, e.g.

```
postgresql://neondb_owner:PASSWORD@ep-xyz.eu-central.aws.neon.tech/neondb?sslmode=require
```

Free tier is enough for tens of thousands of keys.

## 2. Free panel hosting (Vercel)

1. Push this repo to **GitHub** (`git init && git add . && git commit -m "panel"`,
   then `git push` to a new empty repo).
2. On **vercel.com** → *Add New → Project* → import the repo.
3. Add environment variables:

```
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-xyz.eu-central.aws.neon.tech/neondb?sslmode=require
MASTER_PASSWORD=your-strong-password
```

4. Deploy. You get `https://your-panel.vercel.app` — open it on your phone and
   bookmark it. It stays online while your PC is off.

First sign-in: **owner / shakeel258** (or your `MASTER_PASSWORD`).
Change it immediately in **Account**.

Alternatives that work with the same two variables: Render.com free web service
(`npm install && npm run build` / `npm start`), Railway, Coolify on an Oracle
Cloud *Always Free* VM, or your own PC + Tailscale.

## 3. Local development

```bash
npm install
npx drizzle-kit push     # creates users / sessions / licenses / activity tables
npm run dev              # http://localhost:3000
```

The Master Owner account is created automatically on the first login attempt.

---

## API

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | – | sign in, sets HttpOnly session cookie |
| POST | `/api/auth/logout` | session | destroy session |
| GET | `/api/keys?state=&plan=&q=&issuer=` | session | list keys (resellers see only their own) |
| POST | `/api/keys` | session | `{plan:"3d"\|"1m"\|"3m", deviceId?, customer?, note?}` |
| PATCH | `/api/keys/:id` | owner/issuer | `{status, deviceId, customer, note, extendDays}` |
| DELETE | `/api/keys/:id` | owner | delete key |
| GET/POST | `/api/users` | owner | list / create reseller accounts |
| PATCH/DELETE | `/api/users/:id` | owner (self: name/password) | edit, block, cap, revoke-all, delete |
| POST/GET | `/api/verify` | public (app) | Android activation & status check |
| GET | `/api/activity?limit=` | session | audit trail |

### `POST /api/verify` (used by the app)

```jsonc
// request
{ "key": "MS258-XXXX-XXXX-XXXX", "deviceId": "MS258-SAMSUNG-...",
  "plan": "1m", "action": "activate", "app": "Mr. Shakeel", "version": "2.5.8" }

// 200
{ "ok": true, "code": "OK",
  "license": { "planLabel": "1 Month Plan (30 Days)", "days": 30,
               "expiresAt": "2026-06-01T12:00:00.000Z", "daysLeft": 27,
               "deviceId": "MS258-SAMSUNG-...", "boundAt": "..." } }

// errors: NOT_FOUND(404) · EXPIRED(403) · REVOKED(403)
//         DEVICE_MISMATCH(403) · PLAN_MISMATCH(400)
```

Enforced rules: key exists → not revoked → not expired → device binding
matches (first activation binds an unbound key permanently) → selected plan
equals the issued plan.

---

## Android integration

The complete **`MainActivity.java`** (Device ID + one-tap copy,
WhatsApp `+966594534381`, Telegram `@Shakeel9292`, the existing
*Activate License Key* dialog with 3 Days / 1 Month / 3 Months + **ACTIVATE**,
panel verification, local `SharedPreferences` license state, and the status
label that flips from *EXPIRED OR INACTIVE* to *ACTIVE*) is in
[`src/lib/androidCode.ts`](src/lib/androidCode.ts) and can be copied or
downloaded from the **Setup** tab inside the running panel.

One line to change:

```java
private static final String PANEL_URL = "https://your-panel.vercel.app";
```

`AndroidManifest.xml` needs `android.permission.INTERNET`.

---

## Stack

Next.js 16 (App Router) · PostgreSQL + Drizzle ORM · Tailwind CSS 4 ·
scrypt password hashing · signed HttpOnly session cookies.
