"use client";

import { useState } from "react";
import { HealthRecord, deleteHealthRecord, updateHealthRecord } from "@/lib/api";
import { BODY_PART_ICONS, BODY_PARTS, BodyPart } from "@/lib/bodyPart";

interface Props {
  record: HealthRecord;
  onUpdate: (updated: HealthRecord) => void;
  onDelete: (id: number) => void;
}

export default function HealthRecordCard({ record, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    body_part: record.body_part,
    symptom_text: record.symptom_text,
    context_text: record.context_text ?? "",
  });

  const icon = BODY_PART_ICONS[record.body_part as BodyPart] ?? "🩹";
  const timeStr = record.occurred_at
    ? new Date(record.occurred_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : "";

  const handleSave = async () => {
    const updated = await updateHealthRecord(record.id, form);
    onUpdate(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    await deleteHealthRecord(record.id);
    onDelete(record.id);
  };

  const inputStyle = {
    width: "100%",
    border: "1.5px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "0.55rem 0.75rem",
    fontSize: "0.85rem",
    marginBottom: "0.5rem",
    outline: "none",
    color: "var(--text-primary)",
    background: "var(--bg-elevated)",
  };

  if (editing) {
    return (
      <div
        className="scale-in"
        style={{
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          padding: "1rem",
          border: "1.5px solid var(--accent-muted)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <select
          value={form.body_part}
          onChange={(e) => setForm({ ...form, body_part: e.target.value })}
          style={inputStyle}
        >
          {BODY_PARTS.map((bp) => (
            <option key={bp} value={bp}>{BODY_PART_ICONS[bp]} {bp}</option>
          ))}
        </select>
        <input
          value={form.symptom_text}
          onChange={(e) => setForm({ ...form, symptom_text: e.target.value })}
          style={inputStyle}
          placeholder="증상"
        />
        <textarea
          value={form.context_text}
          onChange={(e) => setForm({ ...form, context_text: e.target.value })}
          style={{ ...inputStyle, resize: "none", marginBottom: "0.75rem" }}
          placeholder="추가 메모"
          rows={2}
        />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              background: "var(--accent-gradient)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "0.6rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(34,197,94,0.25)",
            }}
          >
            저장
          </button>
          <button
            onClick={() => setEditing(false)}
            style={{
              flex: 1,
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "0.6rem",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        borderRadius: "var(--radius-lg)",
        padding: "0.875rem 1rem",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border-light)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", flex: 1 }}>
          {/* 부위 아이콘 배지 */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: "var(--accent-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {record.body_part}
              </span>
              {timeStr && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-tertiary)",
                    background: "var(--bg-elevated)",
                    borderRadius: "4px",
                    padding: "1px 5px",
                  }}
                >
                  {timeStr}
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
              {record.symptom_text}
            </p>
            {record.context_text && (
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: "0.2rem 0 0" }}>
                {record.context_text}
              </p>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div style={{ display: "flex", gap: "0.25rem", marginLeft: "0.5rem", flexShrink: 0 }}>
          <button
            onClick={() => setEditing(true)}
            style={{
              fontSize: "0.72rem",
              color: "var(--text-tertiary)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "4px",
              transition: "color 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-dark)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
          >
            수정
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              fontSize: "0.72rem",
              color: "var(--text-tertiary)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "4px",
              transition: "color 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
          >
            삭제
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div
          className="fade-in"
          style={{
            marginTop: "0.75rem",
            padding: "0.75rem",
            background: "#fef2f2",
            borderRadius: "var(--radius-sm)",
            border: "1px solid #fecaca",
          }}
        >
          <p style={{ fontSize: "0.78rem", color: "#dc2626", marginBottom: "0.5rem" }}>
            이 기록을 삭제할까요?
          </p>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button
              onClick={handleDelete}
              style={{
                flex: 1,
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "0.45rem",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              삭제
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                flex: 1,
                background: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "0.45rem",
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
