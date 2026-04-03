"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HealthRecord, getHealthRecords, getHealthRecordsByDate, createHealthRecord } from "@/lib/api";
import HealthRecordCard from "@/components/HealthRecordCard";
import { BODY_PARTS, BODY_PART_ICONS, BodyPart } from "@/lib/bodyPart";
import AuthGuard from "@/components/AuthGuard";

const SEVERITY = ["가벼움", "중간", "심함"] as const;
type Severity = (typeof SEVERITY)[number];

interface RecordForm {
  body_part: BodyPart;
  symptom_text: string;
  severity: Severity | "";
  occurred_at: string;
  context_text: string;
  duration: string;
}

function RecordModal({
  date,
  onClose,
  onSaved,
}: {
  date: string;
  onClose: () => void;
  onSaved: (record: HealthRecord) => void;
}) {
  const defaultTime = `${date}T${new Date().toTimeString().slice(0, 5)}`;
  const [form, setForm] = useState<RecordForm>({
    body_part: "기타",
    symptom_text: "",
    severity: "",
    occurred_at: defaultTime,
    context_text: "",
    duration: "",
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof RecordForm>(key: K, val: RecordForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.symptom_text.trim()) return;
    setSaving(true);
    try {
      const symptom = form.severity
        ? `${form.symptom_text.trim()} · ${form.severity}`
        : form.symptom_text.trim();
      const parts = [form.context_text.trim(), form.duration ? `${form.duration} 지속` : ""].filter(Boolean);
      const context = parts.join(" / ") || undefined;

      const record = await createHealthRecord({
        body_part: form.body_part,
        symptom_text: symptom,
        context_text: context,
        occurred_at: form.occurred_at ? new Date(form.occurred_at).toISOString() : undefined,
      });
      onSaved(record);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.55rem 0.75rem",
    borderRadius: "var(--radius-md)",
    border: "1.5px solid var(--border)",
    background: "var(--bg-chat)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: "0.35rem",
    display: "block",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        zIndex: 100, padding: "0 0 env(safe-area-inset-bottom)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-surface)",
          borderRadius: "20px 20px 0 0",
          padding: "1.25rem 1.1rem 2rem",
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
            직접 기록하기
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.3rem", color: "var(--text-tertiary)", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* 신체 부위 */}
        <div>
          <span style={labelStyle}>신체 부위 *</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {BODY_PARTS.map((bp) => (
              <button
                key={bp}
                onClick={() => set("body_part", bp)}
                style={{
                  padding: "0.35rem 0.7rem",
                  borderRadius: "20px",
                  border: `1.5px solid ${form.body_part === bp ? "var(--accent)" : "var(--border)"}`,
                  background: form.body_part === bp ? "var(--accent-light)" : "var(--bg-chat)",
                  color: form.body_part === bp ? "var(--accent-dark)" : "var(--text-secondary)",
                  fontSize: "0.8rem",
                  fontWeight: form.body_part === bp ? 700 : 400,
                  cursor: "pointer",
                }}
              >
                {BODY_PART_ICONS[bp]} {bp}
              </button>
            ))}
          </div>
        </div>

        {/* 증상 */}
        <div>
          <span style={labelStyle}>증상 *</span>
          <input
            style={inputStyle}
            placeholder="예: 두통, 메스꺼움, 복통..."
            value={form.symptom_text}
            onChange={(e) => set("symptom_text", e.target.value)}
          />
        </div>

        {/* 강도 */}
        <div>
          <span style={labelStyle}>강도 💪</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {SEVERITY.map((s) => (
              <button
                key={s}
                onClick={() => set("severity", form.severity === s ? "" : s)}
                style={{
                  flex: 1,
                  padding: "0.45rem 0",
                  borderRadius: "var(--radius-md)",
                  border: `1.5px solid ${form.severity === s ? "var(--accent)" : "var(--border)"}`,
                  background: form.severity === s ? "var(--accent-light)" : "var(--bg-chat)",
                  color: form.severity === s ? "var(--accent-dark)" : "var(--text-secondary)",
                  fontSize: "0.82rem",
                  fontWeight: form.severity === s ? 700 : 400,
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 발생 일시 */}
        <div>
          <span style={labelStyle}>발생 일시 ⏰</span>
          <input
            type="datetime-local"
            style={inputStyle}
            value={form.occurred_at}
            onChange={(e) => set("occurred_at", e.target.value)}
          />
        </div>

        {/* 상황/계기 */}
        <div>
          <span style={labelStyle}>상황/계기 🔄 <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>(선택)</span></span>
          <input
            style={inputStyle}
            placeholder="예: 식후, 운동 후, 기상 후..."
            value={form.context_text}
            onChange={(e) => set("context_text", e.target.value)}
          />
        </div>

        {/* 지속 시간 */}
        <div>
          <span style={labelStyle}>지속 시간 ⏱ <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>(선택)</span></span>
          <input
            style={inputStyle}
            placeholder="예: 30분, 2시간..."
            value={form.duration}
            onChange={(e) => set("duration", e.target.value)}
          />
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving || !form.symptom_text.trim()}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: saving || !form.symptom_text.trim() ? "var(--border)" : "var(--accent-gradient)",
            color: saving || !form.symptom_text.trim() ? "var(--text-tertiary)" : "#fff",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: saving || !form.symptom_text.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
          }}
        >
          {saving && (
            <span style={{
              width: 14, height: 14,
              border: "2px solid var(--text-tertiary)",
              borderTopColor: "transparent",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }} />
          )}
          {saving ? "저장 중..." : "기록 저장하기"}
        </button>
      </div>
    </div>
  );
}

function CalendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayRecords, setDayRecords] = useState<HealthRecord[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // 초기 진입: URL param 있으면 해당 날짜, 없으면 오늘 날짜 자동 오픈
  useEffect(() => {
    const dateParam = searchParams.get("date");
    const targetDate = dateParam ?? new Date().toISOString().split("T")[0];

    setSelectedDate(targetDate);
    const d = new Date(targetDate);
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setPanelOpen(true);
    getHealthRecordsByDate(targetDate).then(setDayRecords);
  }, [searchParams]);

  // 월별 마킹 로드
  const loadMonthMarks = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const records = await getHealthRecords({ start_date: start, end_date: end });
    const dates = new Set(
      records
        .filter((r) => r.occurred_at)
        .map((r) => r.occurred_at!.split("T")[0])
    );
    setMarkedDates(dates);
  }, [currentDate]);

  useEffect(() => { loadMonthMarks(); }, [loadMonthMarks]);

  // 날짜 클릭
  const handleDateClick = async (dateStr: string) => {
    setSelectedDate(dateStr);
    const records = await getHealthRecordsByDate(dateStr);
    setDayRecords(records);
    setPanelOpen(true);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // 달력 날짜 생성
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)" }}>
      {/* 달력 헤더 */}
      <div style={{ background: "var(--bg-surface)", padding: "1rem 1rem 0.5rem", boxShadow: "var(--shadow-sm)", borderBottom: "1px solid var(--border-light)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
          <button
            onClick={prevMonth}
            style={{ color: "var(--text-tertiary)", background: "none", border: "none", fontSize: "1.25rem", padding: "0.25rem 0.5rem", cursor: "pointer", borderRadius: "6px" }}
          >‹</button>
          <h2 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            {year}년 {month + 1}월
          </h2>
          <button
            onClick={nextMonth}
            style={{ color: "var(--text-tertiary)", background: "none", border: "none", fontSize: "1.25rem", padding: "0.25rem 0.5rem", cursor: "pointer", borderRadius: "6px" }}
          >›</button>
        </div>

        {/* 요일 헤더 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: "0.25rem" }}>
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <div key={d} style={{ fontSize: "0.7rem", color: i === 0 ? "#f87171" : "var(--text-tertiary)", paddingBottom: "0.25rem", fontWeight: 500 }}>{d}</div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center" }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const hasRecord = markedDates.has(dateStr);
            const isSun = (idx % 7) === 0;
            return (
              <button
                key={idx}
                onClick={() => handleDateClick(dateStr)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "0.35rem 0.1rem",
                  borderRadius: "10px",
                  margin: "0 1px 2px",
                  border: "none",
                  cursor: "pointer",
                  background: isSelected
                    ? "var(--accent)"
                    : isToday
                    ? "var(--accent-light)"
                    : "transparent",
                  transition: "background 0.12s",
                }}
              >
                <span style={{
                  fontSize: "0.82rem",
                  fontWeight: isToday || isSelected ? 700 : 400,
                  color: isSelected ? "#fff" : isToday ? "var(--accent-dark)" : isSun ? "#f87171" : "var(--text-primary)",
                }}>
                  {day}
                </span>
                <span style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  marginTop: 2,
                  background: hasRecord ? (isSelected ? "rgba(255,255,255,0.8)" : "var(--accent)") : "transparent",
                  display: "block",
                }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 상세 패널 */}
      {panelOpen && selectedDate && (
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
            <h3 style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
            </h3>
            <button
              onClick={() => setPanelOpen(false)}
              style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer" }}
            >닫기</button>
          </div>

          {dayRecords.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: "3rem", paddingBottom: "2rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem", opacity: 0.4 }}>📋</div>
              <p style={{ color: "var(--text-tertiary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
                이 날은 기록된 증상이 없습니다
              </p>
              <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center" }}>
                <button
                  onClick={() => setModalOpen(true)}
                  style={{
                    background: "var(--bg-surface)",
                    color: "var(--accent-dark)",
                    border: "1.5px solid var(--accent)",
                    borderRadius: "20px",
                    padding: "0.6rem 1.25rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  직접 기록하기
                </button>
                <button
                  onClick={() => router.push("/chat")}
                  style={{
                    background: "var(--accent-gradient)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "20px",
                    padding: "0.6rem 1.25rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(34,197,94,0.3)",
                  }}
                >
                  채팅으로 기록하기
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {dayRecords.map((record) => (
                <HealthRecordCard
                  key={record.id}
                  record={record}
                  onUpdate={(updated) =>
                    setDayRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
                  }
                  onDelete={(id) => {
                    setDayRecords((prev) => prev.filter((r) => r.id !== id));
                    loadMonthMarks();
                  }}
                />
              ))}
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  marginTop: "0.25rem",
                  padding: "0.6rem",
                  borderRadius: "var(--radius-md)",
                  border: "1.5px dashed var(--border)",
                  background: "transparent",
                  color: "var(--text-tertiary)",
                  fontSize: "0.83rem",
                  cursor: "pointer",
                }}
              >
                + 직접 기록 추가
              </button>
            </div>
          )}

          {modalOpen && selectedDate && (
            <RecordModal
              date={selectedDate}
              onClose={() => setModalOpen(false)}
              onSaved={(record) => {
                setDayRecords((prev) => [record, ...prev]);
                loadMonthMarks();
                setModalOpen(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <AuthGuard>
      <Suspense>
        <CalendarContent />
      </Suspense>
    </AuthGuard>
  );
}
