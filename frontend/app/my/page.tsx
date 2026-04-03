"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { getToken, clearToken, clearStoredUserId } from "@/lib/auth";
import { applyFontSize, getFontSize, type FontSize } from "@/components/FontSizeProvider";
import { updateProfile } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const STORAGE_KEY_CONV = "health_conversation_id";
const STORAGE_KEY_MSGS = "health_chat_messages";

interface UserInfo {
  id: number;
  email: string | null;
  name: string | null;
  picture: string | null;
  age: number | null;
  gender: string | null;
}

interface UserProfile {
  age: string;
  gender: "male" | "female" | "other" | "";
}

const FONT_OPTIONS: { value: FontSize; label: string; size: string }[] = [
  { value: "normal", label: "기본", size: "0.85rem" },
  { value: "large", label: "크게", size: "0.95rem" },
  { value: "xlarge", label: "매우 크게", size: "1.1rem" },
];

const GENDER_OPTIONS: { value: UserProfile["gender"]; label: string; emoji: string }[] = [
  { value: "male", label: "남성", emoji: "👨" },
  { value: "female", label: "여성", emoji: "👩" },
  { value: "other", label: "선택 안 함", emoji: "🙂" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "0.6rem" }}>
      {children}
    </p>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1rem 1.1rem", ...style }}>
      {children}
    </div>
  );
}

function MyContent() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [fontSize, setFontSize] = useState<FontSize>("normal");
  const [profile, setProfile] = useState<UserProfile>({ age: "", gender: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        setUser(u);
        if (u) {
          setProfile({
            age: u.age ? String(u.age) : "",
            gender: (u.gender as UserProfile["gender"]) || "",
          });
        }
      })
      .catch(() => null)
      .finally(() => setUserLoading(false));

    setFontSize(getFontSize());
  }, []);

  const handleFontSize = (size: FontSize) => {
    setFontSize(size);
    applyFontSize(size);
  };

  const handleSaveProfile = async () => {
    if (profileSaving) return;
    setProfileSaving(true);
    try {
      await updateProfile({
        age: profile.age ? Number(profile.age) : null,
        gender: profile.gender || null,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    clearStoredUserId();
    localStorage.removeItem(STORAGE_KEY_CONV);
    localStorage.removeItem(STORAGE_KEY_MSGS);
    router.replace("/login");
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100%", padding: "1.5rem 1rem 2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── 프로필 헤더 ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {user?.picture ? (
          <img src={user.picture} alt="프로필" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", boxShadow: "var(--shadow-md)" }} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>
            🧑
          </div>
        )}
        <div>
          <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{user?.name ?? "로딩 중..."}</p>
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>{user?.email ?? ""}</p>
        </div>
      </div>

      {/* ── 내 정보 (선택) ── */}
      <div>
        <SectionTitle>내 정보 (선택)</SectionTitle>
        <Card>
          {/* 안내 문구 */}
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", marginBottom: "1rem", padding: "0.7rem 0.8rem", background: "var(--accent-light)", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>💚</span>
            <p style={{ fontSize: "0.78rem", lineHeight: 1.6, color: "var(--accent-dark)" }}>
              입력하신 정보는 헬스로그 서버에 안전하게 저장돼요. AI가 나이와 성별을 참고해 더 맞춤화된 건강 기록을 도와드릴 수 있어요.
            </p>
          </div>

          {/* 성별 */}
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.45rem" }}>성별</p>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setProfile((p) => ({ ...p, gender: opt.value }))}
                style={{
                  flex: 1,
                  padding: "0.5rem 0",
                  borderRadius: "var(--radius-md)",
                  border: `1.5px solid ${profile.gender === opt.value ? "var(--accent)" : "var(--border)"}`,
                  background: profile.gender === opt.value ? "var(--accent-light)" : "var(--bg-chat)",
                  color: profile.gender === opt.value ? "var(--accent-dark)" : "var(--text-secondary)",
                  fontWeight: profile.gender === opt.value ? 700 : 400,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* 나이 */}
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.45rem" }}>나이</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              type="number"
              min={1}
              max={120}
              value={profile.age}
              onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))}
              placeholder="예: 32"
              style={{
                width: "5rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--border)",
                background: "var(--bg-chat)",
                color: "var(--text-primary)",
                fontSize: "0.88rem",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            <span style={{ fontSize: "0.82rem", color: "var(--text-tertiary)" }}>세</span>
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSaveProfile}
            disabled={profileSaving || userLoading}
            style={{
              width: "100%",
              padding: "0.65rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: profileSaved
                ? "var(--accent-light)"
                : profileSaving || userLoading
                ? "var(--border)"
                : "var(--accent-gradient)",
              color: profileSaved
                ? "var(--accent-dark)"
                : profileSaving || userLoading
                ? "var(--text-tertiary)"
                : "#fff",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: profileSaving || userLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
            }}
          >
            {profileSaving && (
              <span style={{
                width: 14, height: 14, border: "2px solid var(--text-tertiary)",
                borderTopColor: "transparent", borderRadius: "50%",
                display: "inline-block", animation: "spin 0.7s linear infinite",
              }} />
            )}
            {profileSaved ? "✓ 저장됐어요!" : profileSaving ? "저장 중..." : "저장하기"}
          </button>
        </Card>
      </div>

      {/* ── 텍스트 크기 ── */}
      <div>
        <SectionTitle>텍스트 크기</SectionTitle>
        <Card>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleFontSize(opt.value)}
                style={{
                  flex: 1,
                  padding: "0.65rem 0.4rem",
                  borderRadius: "var(--radius-md)",
                  border: `1.5px solid ${fontSize === opt.value ? "var(--accent)" : "var(--border)"}`,
                  background: fontSize === opt.value ? "var(--accent-light)" : "var(--bg-chat)",
                  color: fontSize === opt.value ? "var(--accent-dark)" : "var(--text-secondary)",
                  fontWeight: fontSize === opt.value ? 700 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: opt.size, fontWeight: 700, lineHeight: 1 }}>가</span>
                <span style={{ fontSize: "0.72rem" }}>{opt.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── 서비스 안내 ── */}
      <div>
        <SectionTitle>서비스 안내</SectionTitle>
        <Card>
          <p style={{ fontSize: "0.78rem", lineHeight: 1.7, color: "var(--text-secondary)" }}>
            헬스로그는 건강 상태 기록을 도와드리는 AI 도우미입니다.<br />
            의료 진단이나 처방을 제공하지 않으며, 증상이 지속될 경우 반드시 의사 선생님께 진료를 받으세요.
          </p>
        </Card>
      </div>

      {/* ── 로그아웃 ── */}
      <button
        onClick={handleLogout}
        style={{
          padding: "0.75rem",
          borderRadius: "var(--radius-lg)",
          border: "1px solid #fecaca",
          background: "#fff5f5",
          color: "#ef4444",
          fontWeight: 600,
          fontSize: "0.88rem",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
      >
        로그아웃
      </button>
    </div>
  );
}

export default function MyPage() {
  return (
    <AuthGuard>
      <div style={{ overflowY: "auto", height: "100%" }}>
        <MyContent />
      </div>
    </AuthGuard>
  );
}
