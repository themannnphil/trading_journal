"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.ok) {
      router.push("/journal");
    } else {
      setError("Invalid username or password.");
    }
  }

  const inputClass =
    "w-full bg-[var(--bg-surface2)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-gold/50";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-sm mx-4">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-gold text-3xl font-mono font-bold">◈</span>
            <span className="text-2xl font-bold text-[var(--text)]">Phil Trades</span>
          </div>
          <p className="text-[var(--text-muted)] text-sm">
            Professional trading journal
          </p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-7 space-y-5">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text)]">Sign in</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Use your local credentials to get started</p>
          </div>

          {/* Credentials form */}
          <form onSubmit={handleCredentials} className="space-y-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Username</label>
              <input
                type="text"
                autoComplete="username"
                placeholder="phil"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold-500 transition-colors cursor-pointer disabled:opacity-50 shadow-glow-gold"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[var(--bg-surface)] text-xs text-[var(--text-subtle)]">or</span>
            </div>
          </div>

          {/* Google */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/journal" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="pt-1 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-subtle)]">
              Default credentials are set via <code className="text-gold">LOCAL_USERNAME</code> and <code className="text-gold">LOCAL_PASSWORD</code> in <code className="text-gold">.env.local</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
