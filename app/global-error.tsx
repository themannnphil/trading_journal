"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#111111",
          color: "#F0F0F0",
          fontFamily:
            "'Fira Sans', ui-sans-serif, system-ui, -apple-system, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "420px", padding: "24px" }}>
          {/* Logo */}
          <div
            style={{
              fontSize: "1.5rem",
              color: "#F5A623",
              marginBottom: "32px",
            }}
          >
            ◈
          </div>

          {/* Icon */}
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "12px",
              color: "#F0F0F0",
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              fontSize: "0.875rem",
              color: "#9E9E9E",
              lineHeight: "1.6",
              marginBottom: "8px",
            }}
          >
            An unexpected error occurred. This has been noted.
          </p>

          {error?.digest && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#666666",
                fontFamily: "ui-monospace, monospace",
                marginBottom: "32px",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}

          {!error?.digest && <div style={{ marginBottom: "32px" }} />}

          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#F5A623",
              color: "#111111",
              border: "none",
              borderRadius: "12px",
              padding: "12px 28px",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 0 18px rgba(245,166,35,0.3)",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
