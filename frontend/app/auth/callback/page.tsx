"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { setToken, setStoredUserId, getStoredUserId } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const STORAGE_KEY_CONV = "health_conversation_id";
const STORAGE_KEY_MSGS = "health_chat_messages";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    setToken(token);

    // 유저 정보 조회 후 user_id 비교 → 다른 계정이면 채팅 이력 초기화
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((user) => {
        const prevUserId = getStoredUserId();
        if (prevUserId && prevUserId !== String(user.id)) {
          // 다른 계정 → 이전 채팅 이력 삭제
          localStorage.removeItem(STORAGE_KEY_CONV);
          localStorage.removeItem(STORAGE_KEY_MSGS);
        }
        setStoredUserId(user.id);
        router.replace("/chat");
      })
      .catch(() => {
        router.replace("/chat");
      });
  }, [searchParams, router]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}
    >
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
        로그인 처리 중...
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackContent />
    </Suspense>
  );
}
