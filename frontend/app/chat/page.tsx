"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import ChatMessage from "@/components/ChatMessage";
import VoiceInput from "@/components/VoiceInput";
import { createConversation, streamMessage } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";

interface Message {
  role: "user" | "assistant";
  content: string;
  recordedDate?: string;
}

const STORAGE_KEY_CONV = "health_conversation_id";
const STORAGE_KEY_MSGS = "health_chat_messages";

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "안녕하세요! 오늘 몸 상태는 어떠세요? 편하게 말씀해 주시면 기록해 드릴게요 😊",
};

function ChatPage() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // localStorage에서 복원, 없으면 새 conversation 생성
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_CONV);
    const savedMsgs = localStorage.getItem(STORAGE_KEY_MSGS);

    if (savedId && savedMsgs) {
      setConversationId(Number(savedId));
      setMessages(JSON.parse(savedMsgs));
    } else {
      createConversation().then((c) => {
        setConversationId(c.id);
        localStorage.setItem(STORAGE_KEY_CONV, String(c.id));
        localStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify([INITIAL_MESSAGE]));
      });
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = async (text: string) => {
    if (!text.trim() || loading || !conversationId) return;

    const userMsg: Message = { role: "user", content: text };
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setInput("");
    setLoading(true);

    let streamedText = "";
    let savedRecordIds: number[] = [];

    try {
      await streamMessage(conversationId, text, (event) => {
        if (event.type === "text_delta" && event.text) {
          streamedText += event.text;
          flushSync(() => {
            setMessages([...withUser, { role: "assistant", content: streamedText }]);
          });
        } else if (event.type === "record_saved" && event.record_ids) {
          savedRecordIds = [...savedRecordIds, ...event.record_ids];
        }
      });

      const recordedDate =
        savedRecordIds.length > 0 ? new Date().toISOString().split("T")[0] : undefined;
      const finalMessages: Message[] = [
        ...withUser,
        { role: "assistant", content: streamedText, recordedDate },
      ];
      setMessages(finalMessages);
      localStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify(finalMessages));
    } catch {
      const finalMessages: Message[] = [
        ...withUser,
        { role: "assistant", content: "죄송해요, 잠시 오류가 발생했어요. 다시 시도해 주세요." },
      ];
      setMessages(finalMessages);
      localStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify(finalMessages));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2" style={{ background: "var(--bg-chat)" }}>
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            recordedDate={msg.recordedDate}
          />
        ))}
        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "0.75rem", alignItems: "flex-end", gap: "0.5rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", flexShrink: 0, boxShadow: "0 2px 6px rgba(34,197,94,0.25)" }}>🌿</div>
            <div style={{ background: "var(--bg-surface)", borderRadius: "18px 18px 18px 4px", padding: "0.75rem 1rem", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-light)", display: "flex", gap: "5px", alignItems: "center" }}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 면책 문구 */}
      <p style={{ textAlign: "center", fontSize: "0.65rem", padding: "0.25rem 1rem", color: "var(--text-tertiary)", background: "var(--bg-chat)" }}>
        의료 진단을 제공하지 않습니다 · 건강 기록 보조 목적
      </p>

      {/* 입력창 */}
      <div
        style={{
          padding: "0.65rem 1rem 0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          borderTop: "1px solid var(--border-light)",
          background: "var(--bg-surface)",
          boxShadow: "0 -2px 8px rgba(16,48,20,0.04)",
        }}
      >
        {/* 음성 입력 — Primary CTA */}
        <VoiceInput onTranscript={(t) => { setInput((prev) => prev + t); }} />

        {/* 구분선 */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border-light)" }} />
          <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>또는 입력하기</span>
          <div style={{ flex: 1, height: 1, background: "var(--border-light)" }} />
        </div>

        {/* 텍스트 입력 */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit(input)}
          placeholder="증상을 편하게 입력하세요..."
          style={{
            flex: 1,
            borderRadius: "20px",
            padding: "0.55rem 1rem",
            fontSize: "0.875rem",
            outline: "none",
            background: "var(--bg-chat)",
            color: "var(--text-primary)",
            border: "1.5px solid var(--border)",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          disabled={loading}
        />
        <button
          onClick={() => submit(input)}
          disabled={loading || !input.trim()}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--accent-gradient)",
            border: "none",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(34,197,94,0.3)",
            fontSize: "1rem",
            opacity: loading || !input.trim() ? 0.4 : 1,
            transition: "opacity 0.15s, transform 0.1s",
          }}
        >
          ↑
        </button>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedChatPage() {
  return (
    <AuthGuard>
      <ChatPage />
    </AuthGuard>
  );
}
