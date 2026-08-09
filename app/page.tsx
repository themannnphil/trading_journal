import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/journal");

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: "#111111", color: "#F0F0F0" }}
    >
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(17,17,17,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #2A2A2A",
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: "#F5A623", fontSize: "1.35rem" }}>◈</span>
          <span className="text-lg font-semibold tracking-tight" style={{ color: "#F0F0F0" }}>
            TradeLog
          </span>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium transition-colors"
          style={{ color: "#9E9E9E" }}
          onMouseOver={(e) => (e.currentTarget.style.color = "#F5A623")}
          onMouseOut={(e) => (e.currentTarget.style.color = "#9E9E9E")}
        >
          Sign in →
        </Link>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-6 py-28 md:py-36 text-center"
        style={{ background: "#111111" }}
      >
        {/* Background glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(245,166,35,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <div
            className="mb-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: "rgba(245,166,35,0.12)",
              color: "#F5A623",
              border: "1px solid rgba(245,166,35,0.25)",
            }}
          >
            Built for funded traders
          </div>
          <h1
            className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl"
            style={{
              background: "linear-gradient(135deg, #F0F0F0 30%, #F5A623 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Track every trade.
            <br />
            Protect every account.
          </h1>
          <p
            className="mx-auto mb-10 max-w-xl text-lg leading-relaxed"
            style={{ color: "#9E9E9E" }}
          >
            The professional journal built for funded traders — prop firms, live
            accounts, and everything in between.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-sm font-semibold transition-all"
              style={{
                background: "#F5A623",
                color: "#111111",
                boxShadow: "0 0 20px rgba(245,166,35,0.35)",
              }}
            >
              Get Started — It&apos;s Free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-sm font-semibold transition-all"
              style={{
                background: "transparent",
                color: "#F0F0F0",
                border: "1px solid #333333",
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features row 1 ───────────────────────────────────────────────── */}
      <section className="px-6 pb-6 pt-16">
        <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon="📊"
            title="Full Trade Analytics"
            body="Win rate, R:R, P&L by session, day, instrument."
          />
          <FeatureCard
            icon="🏦"
            title="Multi-Account Dashboard"
            body="Manage evaluation and live accounts in one place."
          />
          <FeatureCard
            icon="⚡"
            title="Auto Risk Tracking"
            body="Daily drawdown alerts. Auto-status on Blown/Passed."
          />
        </div>
      </section>

      {/* ── Features row 2 ───────────────────────────────────────────────── */}
      <section className="px-6 pb-20 pt-6">
        <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon="📓"
            title="Weekend Journal"
            body="Reflect weekly. Review what worked and why."
          />
          <FeatureCard
            icon="📋"
            title="ICT Playbook"
            body="Write and store your full trading methodology."
          />
          <FeatureCard
            icon="🏆"
            title="Pass Certificates"
            body="Upload your funded account pass certificates."
          />
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div
          className="mx-auto max-w-3xl rounded-2xl px-8 py-14 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(245,166,35,0.15) 0%, rgba(245,166,35,0.05) 100%)",
            border: "1px solid rgba(245,166,35,0.25)",
          }}
        >
          <h2 className="mb-6 text-3xl font-bold md:text-4xl" style={{ color: "#F0F0F0" }}>
            Ready to trade with clarity?
          </h2>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-sm font-semibold transition-all"
            style={{
              background: "#F5A623",
              color: "#111111",
              boxShadow: "0 0 20px rgba(245,166,35,0.35)",
            }}
          >
            Start Journaling Free
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer
        className="px-6 py-8 text-center text-sm"
        style={{ borderTop: "1px solid #222222", color: "#666666" }}
      >
        <div className="mx-auto flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
          <span>© 2026 TradeLog</span>
          <span className="hidden sm:inline" style={{ color: "#333333" }}>·</span>
          <Link href="/privacy" className="transition-colors hover:text-[#9E9E9E]">
            Privacy Policy
          </Link>
          <span className="hidden sm:inline" style={{ color: "#333333" }}>·</span>
          <Link href="/terms" className="transition-colors hover:text-[#9E9E9E]">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 transition-all"
      style={{
        background: "#1A1A1A",
        border: "1px solid #2A2A2A",
      }}
    >
      <div className="mb-3 text-2xl">{icon}</div>
      <h3 className="mb-2 text-base font-semibold" style={{ color: "#F0F0F0" }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "#9E9E9E" }}>
        {body}
      </p>
    </div>
  );
}
