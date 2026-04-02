"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HealthRecord, getHealthRecords, getHealthRecordsByDate } from "@/lib/api";
import HealthRecordCard from "@/components/HealthRecordCard";
import { BODY_PART_ICONS, BodyPart } from "@/lib/bodyPart";
import AuthGuard from "@/components/AuthGuard";

function CalendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayRecords, setDayRecords] = useState<HealthRecord[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

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
            </div>
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
