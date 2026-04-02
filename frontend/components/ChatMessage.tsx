"use client";

import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

interface Props {
  role: "user" | "assistant";
  content: string;
  recordedDate?: string;
}

export default function ChatMessage({ role, content, recordedDate }: Props) {
  const router = useRouter();
  const isUser = role === "user";

  return (
    <div
      className="msg-enter"
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "0.75rem",
        alignItems: "flex-end",
        gap: "0.5rem",
      }}
    >
      {/* 어시스턴트 아바타 */}
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--accent-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            flexShrink: 0,
            marginBottom: 2,
            boxShadow: "0 2px 6px rgba(34,197,94,0.25)",
          }}
        >
          🌿
        </div>
      )}

      <div
        style={{
          maxWidth: "78%",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          padding: "0.85rem 1.1rem",
          fontSize: "0.88rem",
          lineHeight: 1.65,
          ...(isUser
            ? {
                background: "var(--accent-gradient)",
                color: "#fff",
                boxShadow: "0 2px 8px rgba(34,197,94,0.28)",
              }
            : {
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                boxShadow: "var(--shadow-card)",
                border: "1px solid var(--border-light)",
              }),
        }}
      >
        {isUser ? (
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{content}</p>
        ) : (
          <div className="md-content">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
        {!isUser && recordedDate && (
          <button
            onClick={() => router.push(`/calendar?date=${recordedDate}`)}
            style={{
              marginTop: "0.5rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--accent-dark)",
              background: "var(--accent-light)",
              border: "none",
              borderRadius: "6px",
              padding: "0.3rem 0.6rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            달력에서 확인하기 →
          </button>
        )}
      </div>
    </div>
  );
}
