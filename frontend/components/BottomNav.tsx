"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN_PATHS = ["/login", "/auth"];

const NAV_ITEMS = [
  {
    href: "/chat",
    label: "채팅",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" width="22" height="22">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/calendar",
    label: "달력",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
        <rect x="3" y="4" width="18" height="18" rx="2" strokeLinejoin="round" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
        <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
        <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "/my",
    label: "마이",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinejoin="round" />
        <circle cx="12" cy="7" r="4" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      style={{
        display: "flex",
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-light)",
        height: 60,
        flexShrink: 0,
        boxShadow: "0 -1px 8px rgba(16,48,20,0.05)",
      }}
    >
      {NAV_ITEMS.map(({ href, icon, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              fontSize: "0.7rem",
              fontWeight: active ? 600 : 400,
              color: active ? "var(--accent-dark)" : "var(--text-tertiary)",
              textDecoration: "none",
              position: "relative",
              transition: "color 0.15s",
            }}
          >
            {/* 활성 탭 상단 인디케이터 */}
            {active && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 28,
                  height: 2.5,
                  borderRadius: "0 0 3px 3px",
                  background: "var(--accent-gradient)",
                }}
              />
            )}
            {icon(active)}
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
