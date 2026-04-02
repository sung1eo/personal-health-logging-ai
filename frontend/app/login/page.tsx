"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "2rem 1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 배경 블롭 */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          right: "-20%",
          width: 340,
          height: 340,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "-15%",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* 로고 */}
      <div
        className="scale-in"
        style={{ textAlign: "center", marginBottom: "2.5rem" }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: "22px",
            background: "var(--accent-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            margin: "0 auto 1rem",
            boxShadow: "0 8px 24px rgba(34,197,94,0.3), 0 2px 8px rgba(34,197,94,0.2)",
          }}
        >
          🌿
        </div>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 0.4rem",
            letterSpacing: "-0.03em",
          }}
        >
          헬스로그
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.875rem",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          건강 상태를 자연스럽게 기록하세요
        </p>
      </div>

      {/* 카드 */}
      <div
        className="scale-in"
        style={{
          background: "var(--bg-surface)",
          borderRadius: "20px",
          padding: "1.75rem 1.5rem",
          width: "100%",
          maxWidth: "360px",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border-light)",
          animationDelay: "0.06s",
        }}
      >
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.8rem",
            textAlign: "center",
            marginBottom: "1.25rem",
          }}
        >
          계속하려면 로그인이 필요해요
        </p>

        <button
          onClick={handleGoogleLogin}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            background: "#fff",
            border: "1.5px solid var(--border)",
            borderRadius: "12px",
            padding: "0.875rem 1.5rem",
            fontSize: "0.9rem",
            fontWeight: 500,
            color: "#3c4043",
            cursor: "pointer",
            width: "100%",
            transition: "border-color 0.15s, box-shadow 0.15s, transform 0.1s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.boxShadow = "0 2px 12px rgba(34,197,94,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <GoogleIcon />
          Google로 로그인
        </button>
      </div>

      {/* 푸터 */}
      <p
        style={{
          marginTop: "2rem",
          color: "var(--text-tertiary)",
          fontSize: "0.7rem",
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        의료 진단을 제공하지 않습니다
        <br />
        건강 기록 보조 목적으로만 사용해 주세요
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
