import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center font-sans"
      style={{ background: "#111111", color: "#F0F0F0" }}
    >
      {/* Logo */}
      <Link href="/" className="mb-12 flex items-center gap-2">
        <span style={{ color: "#F5A623", fontSize: "1.3rem" }}>◈</span>
        <span className="text-lg font-semibold" style={{ color: "#9E9E9E" }}>
          TradeLog
        </span>
      </Link>

      {/* 404 */}
      <div
        className="mb-4 text-8xl font-bold leading-none tracking-tighter md:text-9xl"
        style={{ color: "#F5A623" }}
      >
        404
      </div>

      <h1
        className="mb-3 text-2xl font-semibold md:text-3xl"
        style={{ color: "#F0F0F0" }}
      >
        Page not found
      </h1>

      <p className="mb-10 max-w-sm text-sm leading-relaxed" style={{ color: "#9E9E9E" }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Head back to get your trades on track.
      </p>

      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-xl px-7 py-3 text-sm font-semibold transition-all"
        style={{
          background: "#F5A623",
          color: "#111111",
          boxShadow: "0 0 18px rgba(245,166,35,0.3)",
        }}
      >
        Back to TradeLog
      </Link>
    </div>
  );
}
