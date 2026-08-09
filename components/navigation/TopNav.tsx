"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/journal",   label: "Journal" },
  { href: "/accounts",  label: "Accounts" },
  { href: "/analytics", label: "Analytics" },
  { href: "/playbook",  label: "Playbook" },
  { href: "/settings",  label: "Settings" },
  { href: "http://localhost:3001", label: "Calculator" },
];

export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 h-14 border-b border-[var(--border)] bg-[var(--bg-surface)] backdrop-blur-sm">
      <div className="max-w-screen-xl mx-auto h-full px-4 flex items-center gap-6">
        {/* Logo */}
        <Link href="/journal" className="flex items-center gap-2 shrink-0">
          <span className="text-gold font-mono font-bold text-lg">◈</span>
          <span className="font-semibold text-[var(--text)] hidden sm:block text-sm">
            Phil Trades
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer ${
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
        <div className="ml-auto flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface2)] transition-colors duration-150 cursor-pointer"
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

          {/* Profile dropdown */}
          {session?.user && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-[var(--bg-surface2)] transition-colors duration-150 cursor-pointer"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center text-xs font-bold text-white">
                    {session.user.name?.[0] ?? "P"}
                  </div>
                )}
                <span className="text-sm text-[var(--text)] hidden md:block">
                  {session.user.name?.split(" ")[0]}
                </span>
                <svg className="w-3 h-3 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg shadow-lg py-1 animate-fade-in">
                    <div className="px-3 py-2 border-b border-[var(--border)]">
                      <p className="text-xs font-medium text-[var(--text)]">{session.user.name}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{session.user.email}</p>
                    </div>
                    <button
                      onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/login" }); }}
                      className="w-full text-left px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface2)] transition-colors cursor-pointer"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
