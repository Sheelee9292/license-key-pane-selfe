import { CopyBlock } from "@/components/CopyBlock";
import {
  ANDROID_MANIFEST_SNIPPET,
  MAIN_ACTIVITY_JAVA,
} from "@/lib/androidCode";

const STEPS: { n: string; title: string; body: React.ReactNode }[] = [
  {
    n: "01",
    title: "Create the free database (2 minutes, phone or PC)",
    body: (
      <>
        <p>
          Open <b>neon.tech</b> (or <b>supabase.com</b> → Database →
          Connection string). Both have a permanently free Postgres tier. Sign
          in with GitHub, click <b>Create project</b>, pick any name and region
          (choose the one closest to Saudi Arabia / UAE, e.g.{" "}
          <code>eu-central</code>). When it finishes, copy the{" "}
          <b>PostgreSQL connection string</b> — it looks like:
        </p>
        <Code>
          postgresql://neondb_owner:AbC123@ep-xyz-123.eu-central.aws.neon.tech/
          neondb?sslmode=require
        </Code>
        <p>
          Keep that tab open. Nothing on it costs money — the free tier gives
          you enough rows for tens of thousands of license keys.
        </p>
      </>
    ),
  },
  {
    n: "02",
    title: "Get the panel code onto GitHub (free)",
    body: (
      <>
        <p>
          Install <b>Git</b> (git-scm.com) if your PC does not have it, then in
          the project folder run:
        </p>
        <Code>
          {`git init
git add .
git commit -m "Mr. Shakeel license panel"
# create an empty repo on github.com first, then:
git remote add origin https://github.com/YOUR-NAME/mr-shakeel-panel.git
git push -u origin master`}
        </Code>
        <p>
          No PC? Use the GitHub mobile app → <b>+ → New repository</b> → upload
          the files one by one from your phone. It works, just slower.
        </p>
      </>
    ),
  },
  {
    n: "03",
    title: "Deploy 100% free on Vercel (the panel itself)",
    body: (
      <>
        <p>
          Go to <b>vercel.com</b> → sign in with GitHub → <b>Add New → Project</b>{" "}
          → import your <code>mr-shakeel-panel</code> repo. Before clicking
          Deploy, open <b>Environment Variables</b> and add exactly two:
        </p>
        <Code>
          {`DATABASE_URL=postgresql://neondb_owner:AbC123@ep-xyz-123.eu-central.aws.neon.tech/neondb?sslmode=require
MASTER_PASSWORD=your-new-strong-password`}
        </Code>
        <p>
          Leave the framework preset on <b>Next.js</b> and press{" "}
          <b>Deploy</b>. ~60 seconds later you get an address like{" "}
          <code>mr-shakeel-panel.vercel.app</code> — <b>bookmark it on your
          phone</b>. That is your permanent, free, phone-controllable panel: it
          stays online even when your PC is off.
        </p>
        <p className="text-stamp">
          First sign-in: username <b>owner</b>, password{" "}
          <b>shakeel258</b> (or your MASTER_PASSWORD) → immediately change it
          in <b>Account</b>.
        </p>
      </>
    ),
  },
  {
    n: "04",
    title: "Create the tables (one command)",
    body: (
      <>
        <p>From the project folder on your PC, with the same DATABASE_URL:</p>
        <Code>{`npx drizzle-kit push
npm run build`}</Code>
        <p>
          If you deployed on Vercel, the tables are created the first time the
          app boots — just visit{" "}
          <code>https://YOUR-PANEL.vercel.app/login</code> once and the Master
          Owner account plus all tables are created automatically.
        </p>
      </>
    ),
  },
  {
    n: "05",
    title: "Free alternative hosting (if you prefer no Vercel)",
    body: (
      <>
        <p>
          Any of these work with the exact same two environment variables:{" "}
          <b>Render.com</b> (Free Web Service → New → connect GitHub repo →{" "}
          <b>Build Command</b> <code>npm install &amp;&amp; npm run build</code>,{" "}
          <b>Start Command</b> <code>npm start</code>), <b>Railway</b>,{" "}
          <b>Coolify</b> on an Oracle Cloud <i>Always Free</i> VM, or simply{" "}
          <b>your own PC</b> with <code>npm run dev</code> + port forwarding via{" "}
          <b>Tailscale</b> (also free) so you can open it from your phone
          anywhere.
        </p>
        <p>
          The panel is a single Next.js app + one Postgres database. There is no
          other server, no paid API, no subscription — that is the whole
          infrastructure.
        </p>
      </>
    ),
  },
  {
    n: "06",
    title: "Point the Android app at your panel",
    body: (
      <>
        <p>
          In <b>MainActivity.java</b> change one line — <code>PANEL_URL</code> —
          to your address (no trailing slash):
        </p>
        <Code>
          {`private static final String PANEL_URL = "https://mr-shakeel-panel.vercel.app";`}
        </Code>
        <p>
          Rebuild in Android Studio, install on a phone, and the app will talk
          to your panel for every activation.
        </p>
      </>
    ),
  },
];

export default function GuidePage() {
  return (
    <div className="space-y-8">
      <header className="border-b-2 border-ink pb-5">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-stamp mb-1.5">
          operations manual · zero cost
        </div>
        <h1 className="font-display text-[40px] sm:text-6xl leading-[0.95] tracking-tight">
          Free hosting, <span className="italic">database</span> &amp; Android
          wiring
        </h1>
        <p className="mt-2.5 text-sm text-ink-2 max-w-2xl">
          Every step below costs <b>0 SAR</b> — free database, free hosting, free
          panel, free app integration. Do them in order; each takes a couple of
          minutes and can be done from your phone.
        </p>
      </header>

      {/* ---- setup steps ---- */}
      <ol className="space-y-6">
        {STEPS.map((s) => (
          <li key={s.n} className="grid sm:grid-cols-[64px_1fr] gap-3 sm:gap-5">
            <div className="font-display text-5xl leading-none text-stamp sm:text-right">
              {s.n}
            </div>
            <div className="border-l-2 border-rule pl-4 sm:pl-5 pb-1">
              <h2 className="font-display text-2xl sm:text-3xl leading-tight mb-2">
                {s.title}
              </h2>
              <div className="space-y-2.5 text-[13.5px] leading-relaxed text-ink-2 [&_code]:font-mono [&_code]:text-[12px] [&_code]:bg-paper-2 [&_code]:px-1 [&_code]:text-ink">
                {s.body}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {/* ---- customer workflow ---- */}
      <section className="border-2 border-ink">
        <div className="bg-ink text-paper px-4 py-2.5 font-mono text-[10px] tracking-[0.26em] uppercase">
          customer workflow · device id → message → key → activate
        </div>
        <div className="p-4 sm:p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              t: "1 · copy device id",
              d: "Customer opens Mr. Shakeel v2.5.8 and taps COPY DEVICE ID.",
            },
            {
              t: "2 · send it to you",
              d: "They tap WhatsApp (+966594534381) or Telegram (@Shakeel9292) — the message is pre-filled with their ID.",
            },
            {
              t: "3 · you issue the key",
              d: "From this panel on your phone: pick 3 Days / 1 Month / 3 Months, paste their device ID (optional), GENERATE, then send the voucher on WhatsApp or Telegram.",
            },
            {
              t: "4 · they activate",
              d: "They open the app, choose the same plan, paste the key, tap ACTIVATE. The panel verifies key + plan + device + expiry and the status flips to ACTIVE.",
            },
          ].map((s, i) => (
            <div key={s.t} className="border border-rule bg-paper-2/40 p-3.5">
              <div className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-stamp mb-1.5">
                {s.t}
              </div>
              <p className="text-[13px] leading-relaxed text-ink-2">{s.d}</p>
              <div className="mt-2 font-display text-3xl text-rule leading-none">
                {String(i + 1).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- java code ---- */}
      <section className="space-y-3">
        <div>
          <div className="font-mono text-[9px] tracking-[0.28em] uppercase text-ink-3">
            android studio · java
          </div>
          <h2 className="font-display text-3xl sm:text-4xl leading-none">
            MainActivity.java — complete file
          </h2>
          <p className="mt-2 text-[13.5px] text-ink-2 max-w-3xl">
            Save as <code className="bg-paper-2 px-1">app/src/main/java/com/mrshakeel/app/MainActivity.java</code>.
            It contains the Device ID + copy button, WhatsApp and Telegram
            buttons, the existing Activate License Key dialog (3 Days / 1 Month
            30 Days / 3 Months 90 Days + Enter License Key + ACTIVATE), the
            panel verification call, local license storage and the status label
            that changes from <b>EXPIRED OR INACTIVE</b> to <b>ACTIVE</b>.
          </p>
        </div>
        <CopyBlock
          title="MainActivity.java"
          lang="java"
          code={MAIN_ACTIVITY_JAVA}
          maxHeight={560}
        />
        <CopyBlock
          title="AndroidManifest.xml (add these lines)"
          lang="xml"
          code={ANDROID_MANIFEST_SNIPPET}
          maxHeight={220}
        />
      </section>

      {/* ---- api contract ---- */}
      <section className="space-y-3">
        <h2 className="font-display text-3xl leading-none">
          What the app sends to the panel
        </h2>
        <CopyBlock
          title="POST /api/verify — request &amp; response"
          lang="http"
          code={`POST https://YOUR-PANEL.vercel.app/api/verify
Content-Type: application/json

{
  "key": "MS258-K7QM-XR2P-9TLD",
  "deviceId": "MS258-SAMSUNG-A1F2...",
  "plan": "1m",
  "action": "activate",
  "app": "Mr. Shakeel",
  "version": "2.5.8"
}

200 OK
{
  "ok": true,
  "code": "OK",
  "message": "License activated.",
  "license": {
    "key": "MS258-K7QM-XR2P-9TLD",
    "plan": "1m",
    "planLabel": "1 Month Plan (30 Days)",
    "days": 30,
    "expiresAt": "2026-06-01T12:00:00.000Z",
    "daysLeft": 27,
    "deviceId": "MS258-SAMSUNG-A1F2...",
    "boundAt": "2026-05-05T09:14:00.000Z"
  },
  "app": { "name": "Mr. Shakeel", "version": "2.5.8" }
}

403  { "ok": false, "code": "REVOKED",          "message": "This license has been revoked or blocked." }
403  { "ok": false, "code": "EXPIRED",          "message": "This license has expired. Buy a new plan." }
403  { "ok": false, "code": "DEVICE_MISMATCH",  "message": "This key is bound to a different device." }
400  { "ok": false, "code": "PLAN_MISMATCH",    "message": "This key is for 3 Days Plan." }
404  { "ok": false, "code": "NOT_FOUND",        "message": "Invalid license key. Check and try again." }`}
          maxHeight={520}
        />
      </section>

      {/* ---- support strip ---- */}
      <section className="border-2 border-stamp bg-stamp-soft/50 p-4 sm:p-6 flex flex-wrap gap-6 justify-between items-center">
        <div>
          <div className="font-mono text-[10px] tracking-[0.24em] uppercase text-stamp">
            support channels printed in the app
          </div>
          <div className="font-display text-3xl sm:text-4xl leading-tight mt-1">
            WhatsApp +966 59 453 4381
            <br />
            Telegram @Shakeel9292
          </div>
        </div>
        <div className="font-mono text-[11px] leading-relaxed text-ink-2">
          panel status:{" "}
          <span className="text-ok font-bold">operational</span>
          <br />
          database: <span className="text-ok font-bold">postgres / free tier</span>
          <br />
          app target: <span className="font-bold">Mr. Shakeel 2.5.8</span>
        </div>
      </section>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-auto bg-[#16130e] text-[#e9e2d4] p-3 font-mono text-[11.5px] leading-relaxed my-2">
      {children}
    </pre>
  );
}
