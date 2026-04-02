"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/chat": "헬스로그",
  "/calendar": "기록 달력",
  "/my": "마이",
};

const HIDDEN_PATHS = ["/login", "/auth"];

export default function AppHeader() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  const title =
    Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] ?? "헬스로그";
  const isChat = pathname.startsWith("/chat");

  return (
    <header
      style={{
        height: 52,
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-light)",
        display: "flex",
        alignItems: "center",
        paddingLeft: "1.25rem",
        paddingRight: "1.25rem",
        flexShrink: 0,
        boxShadow: "var(--shadow-sm)",
        position: "relative",
      }}
    >
      {/* 하단 accent line */}
      <span
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: isChat ? "100%" : 0,
          height: 2,
          background: "var(--accent-gradient)",
          opacity: isChat ? 1 : 0,
          transition: "width 0.4s ease, opacity 0.3s",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {isChat && (
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(34,197,94,0.3)",
            }}
          >
            🌿
          </span>
        )}
        <span
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: isChat ? "var(--accent-dark)" : "var(--text-primary)",
          }}
        >
          {title}
        </span>
      </div>
    </header>
  );
}
