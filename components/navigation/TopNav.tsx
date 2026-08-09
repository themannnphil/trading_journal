"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "/journal",   label: "Journal" },
  { href: "/accounts",  label: "Accounts" },
  { href: "/analytics", label: "Analytics" },
  { href: "/playbook",  label: "Playbook" },
  { href: "/settings",  label: "Settings" },
];

export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  // Close mobile menu on navigation
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      <nav className="sticky top-0 z-50 h-14 border-b border-[var(--border)] bg-[var(--bg-surface)] backdrop-blur-sm">
        <div className="max-w-screen-xl mx-auto h-full px-4 flex items-center gap-4">

          {/* Logo */}
          <Link href="/journal" className="flex items-center gap-2 shrink-0">
            <span className="text-gold font-mono font-bold text-lg">◈</span>
            <span className="font-semibold text-[var(--text)] text-sm">TradeLog</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-gold/10 text-gold"
                      : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface2)]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-1">

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface2)] transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Profile dropdown — desktop */}
            {session?.user && (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-[var(--bg-surface2)] transition-colors cursor-pointer"
                >
                  {session.user.image ? (
                    <Image src={session.user.image} alt={session.user.name ?? "User"} width={28} height={28} className="rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center text-xs font-bold text-white">
                      {session.user.name?.[0] ?? "T"}
                    </div>
                  )}
                  <span className="text-sm text-[var(--text)] hidden lg:block">{session.user.name?.split(" ")[0]}</span>
                  <svg className="w-3 h-3 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg shadow-lg py-1">
                      <div className="px-3 py-2 border-b border-[var(--border)]">
                        <p className="text-xs font-medium text-[var(--text)]">{session.user.name}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{session.user.email}</p>
                      </div>
                      <button
                        onClick={() => { setProfileOpen(false); signOut({ callbackUrl: "/login" }); }}
                        className="w-full text-left px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface2)] transition-colors cursor-pointer"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface2)] transition-colors cursor-pointer"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-14 left-0 right-0 z-50 md:hidden bg-[var(--bg-surface)] border-b border-[var(--border)] shadow-2xl">

            {/* Nav links */}
            <div className="px-3 py-2 space-y-0.5">
              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-gold/10 text-gold"
                        : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface2)]"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* User + sign out */}
            {session?.user && (
              <div className="px-3 pb-3 border-t border-[var(--border)] pt-3">
                <div className="flex items-center gap-3 px-3 mb-2">
                  {session.user.image ? (
                    <Image src={session.user.image} alt={session.user.name ?? "User"} width={36} height={36} className="rounded-full" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-sm font-bold text-white">
                      {session.user.name?.[0] ?? "T"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text)]">{session.user.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{session.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/login" }); }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-[var(--bg-surface2)] transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
