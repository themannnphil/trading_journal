import Link from "next/link";

export const metadata = {
  title: "Terms of Service — TradeLog",
  description: "Terms of Service for TradeLog trading journal.",
};

export default function TermsPage() {
  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: "#111111", color: "#F0F0F0" }}
    >
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid #222222" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <span style={{ color: "#F5A623", fontSize: "1.2rem" }}>◈</span>
          <span className="text-base font-semibold" style={{ color: "#F0F0F0" }}>
            TradeLog
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm transition-colors"
          style={{ color: "#9E9E9E" }}
        >
          ← Back to home
        </Link>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1
          className="mb-2 text-4xl font-bold"
          style={{ color: "#F0F0F0" }}
        >
          Terms of Service
        </h1>
        <p className="mb-10 text-sm" style={{ color: "#666666" }}>
          Effective date: August 2026
        </p>

        <ProseSection title="1. Acceptance of Terms">
          By accessing or using TradeLog, you agree to be bound by these Terms
          of Service. If you do not agree to these terms, please do not use the
          service.
        </ProseSection>

        <ProseSection title="2. No Financial Advice">
          TradeLog is a personal journaling and trade-tracking tool provided for
          informational and organizational purposes only.{" "}
          <strong style={{ color: "#D0D0D0" }}>
            Nothing on this platform constitutes financial, investment, or
            trading advice.
          </strong>{" "}
          All trading involves substantial risk of loss. You are solely
          responsible for your own trading decisions, and TradeLog accepts no
          liability for any losses you may incur.
        </ProseSection>

        <ProseSection title="3. Your Responsibility">
          <ul className="ml-5 list-disc space-y-2" style={{ color: "#9E9E9E" }}>
            <li>
              You are solely responsible for all trading decisions and their
              outcomes.
            </li>
            <li>
              You agree to use TradeLog only for lawful purposes and in
              accordance with these Terms.
            </li>
            <li>
              You are responsible for maintaining the confidentiality of your
              account credentials.
            </li>
            <li>
              You represent that all data you enter is accurate to the best of
              your knowledge.
            </li>
          </ul>
        </ProseSection>

        <ProseSection title="4. No Affiliation with Prop Firms">
          TradeLog is an independent product and is not affiliated with,
          endorsed by, or in partnership with any proprietary trading firm,
          evaluation company, or financial institution. Any prop firm names,
          rules, or data you enter are your own records and do not imply any
          official relationship with those organizations.
        </ProseSection>

        <ProseSection title="5. Service Provided As-Is">
          TradeLog is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of
          any kind, whether express or implied. We do not guarantee that the
          service will be uninterrupted, error-free, or free of harmful
          components. We reserve the right to modify, suspend, or discontinue
          the service at any time with or without notice.
        </ProseSection>

        <ProseSection title="6. Account Deletion">
          You may request deletion of your account and all associated data at
          any time by contacting us at{" "}
          <a href="mailto:support@tradelog.app" style={{ color: "#F5A623" }}>
            support@tradelog.app
          </a>
          . We will process deletion requests within 30 days. Upon deletion,
          your data will be permanently removed from our systems.
        </ProseSection>

        <ProseSection title="7. Limitation of Liability">
          To the maximum extent permitted by applicable law, TradeLog and its
          operators shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages, including but not limited to loss
          of trading capital, loss of profits, or data loss arising from your
          use of the service.
        </ProseSection>

        <ProseSection title="8. Intellectual Property">
          The TradeLog application, its design, and its original content are
          owned by TradeLog and are protected by intellectual property laws. You
          retain all ownership rights to the trade data and content you enter
          into the platform.
        </ProseSection>

        <ProseSection title="9. Updates to These Terms">
          We may update these Terms of Service from time to time. We will notify
          users of material changes by updating the effective date at the top of
          this page. Continued use of the service after changes are posted
          constitutes acceptance of the updated terms.
        </ProseSection>

        <ProseSection title="10. Governing Law">
          These Terms shall be governed by and construed in accordance with the
          laws of the applicable jurisdiction. Any disputes arising under these
          Terms shall be subject to the exclusive jurisdiction of the courts in
          that jurisdiction.
        </ProseSection>

        <ProseSection title="11. Contact">
          For questions about these Terms of Service, please contact us at{" "}
          <a href="mailto:support@tradelog.app" style={{ color: "#F5A623" }}>
            support@tradelog.app
          </a>
          .
        </ProseSection>
      </main>

      {/* Footer */}
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

function ProseSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2
        className="mb-4 text-xl font-semibold"
        style={{ color: "#F0F0F0" }}
      >
        {title}
      </h2>
      <div className="text-sm leading-7" style={{ color: "#9E9E9E" }}>
        {children}
      </div>
    </section>
  );
}
