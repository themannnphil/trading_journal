import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — TradeLog",
  description: "Privacy Policy for TradeLog trading journal.",
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mb-10 text-sm" style={{ color: "#666666" }}>
          Effective date: August 2026
        </p>

        <ProseSection title="1. Introduction">
          TradeLog (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your
          personal information. This Privacy Policy explains what data we
          collect, how we use it, and the choices you have.
        </ProseSection>

        <ProseSection title="2. Data We Collect">
          <p className="mb-3">We collect the following information when you use TradeLog:</p>
          <ul className="ml-5 list-disc space-y-2" style={{ color: "#9E9E9E" }}>
            <li>
              <strong style={{ color: "#D0D0D0" }}>Account information</strong> — your name and email
              address, obtained when you sign in via Google OAuth.
            </li>
            <li>
              <strong style={{ color: "#D0D0D0" }}>Trade data</strong> — all trades, accounts, notes, and
              journal entries you manually enter into the application.
            </li>
            <li>
              <strong style={{ color: "#D0D0D0" }}>Uploaded images</strong> — trade screenshots and
              certificates you upload within the app.
            </li>
            <li>
              <strong style={{ color: "#D0D0D0" }}>Usage data</strong> — basic session information to keep
              you signed in (JWT tokens stored in secure HTTP-only cookies).
            </li>
          </ul>
        </ProseSection>

        <ProseSection title="3. How We Store Your Data">
          <p className="mb-3">Your data is stored using the following services:</p>
          <ul className="ml-5 list-disc space-y-2" style={{ color: "#9E9E9E" }}>
            <li>
              <strong style={{ color: "#D0D0D0" }}>MongoDB Atlas</strong> — all structured data (accounts,
              trades, journal entries, playbook content) is stored in a
              MongoDB Atlas cloud database with encryption at rest.
            </li>
            <li>
              <strong style={{ color: "#D0D0D0" }}>Cloudinary</strong> — images you upload are stored
              securely via Cloudinary&apos;s cloud media storage service.
            </li>
          </ul>
          <p className="mt-3">
            We take reasonable technical measures to protect your data, but no
            system is 100% secure. You use the service at your own risk.
          </p>
        </ProseSection>

        <ProseSection title="4. Google OAuth">
          When you sign in with Google, we receive your name, email address, and
          profile image from Google. We use this information solely to create and
          identify your account. We do not access your Google Drive, Gmail, or
          any other Google service. Your sign-in is governed by{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#F5A623" }}
          >
            Google&apos;s Privacy Policy
          </a>
          .
        </ProseSection>

        <ProseSection title="5. How We Use Your Data">
          <ul className="ml-5 list-disc space-y-2" style={{ color: "#9E9E9E" }}>
            <li>To provide and operate the TradeLog application.</li>
            <li>To authenticate you and maintain your session.</li>
            <li>
              To display your trading data, analytics, and journal back to you.
            </li>
            <li>
              To send important service-related communications if necessary.
            </li>
          </ul>
        </ProseSection>

        <ProseSection title="6. We Do Not Sell Your Data">
          We do not sell, rent, or share your personal information or trade data
          with any third parties for marketing or commercial purposes. Your data
          is yours.
        </ProseSection>

        <ProseSection title="7. Data Retention & Deletion">
          Your data is retained as long as your account is active. You may
          request deletion of your account and all associated data at any time by
          contacting us at{" "}
          <a href="mailto:support@tradelog.app" style={{ color: "#F5A623" }}>
            support@tradelog.app
          </a>
          . We will process deletion requests within 30 days.
        </ProseSection>

        <ProseSection title="8. Third-Party Services">
          TradeLog uses the following third-party services to operate:
          <ul className="ml-5 mt-3 list-disc space-y-2" style={{ color: "#9E9E9E" }}>
            <li>MongoDB Atlas (database hosting)</li>
            <li>Cloudinary (image storage)</li>
            <li>Google OAuth (authentication)</li>
            <li>Vercel (application hosting)</li>
          </ul>
          Each of these services has its own privacy policy governing the data
          they process.
        </ProseSection>

        <ProseSection title="9. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify
          users of material changes by updating the effective date above or by
          other reasonable means.
        </ProseSection>

        <ProseSection title="10. Contact Us">
          If you have any questions about this Privacy Policy, please contact us
          at{" "}
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
