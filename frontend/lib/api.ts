import { getToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface HealthRecord {
  id: number;
  body_part: string;
  symptom_text: string;
  context_text: string | null;
  occurred_at: string | null;
  recorded_at: string;
  source: string;
}

export interface MessageResponse {
  response: string;
  saved_record_ids: number[];
  conversation_id: number;
}

export async function createConversation(): Promise<{ id: number }> {
  const res = await fetch(`${BASE_URL}/conversations`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to create conversation");
  return res.json();
}

export async function sendMessage(
  conversationId: number,
  content: string
): Promise<MessageResponse> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

export async function getHealthRecords(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<HealthRecord[]> {
  const url = new URL(`${BASE_URL}/health-records`);
  if (params?.start_date) url.searchParams.set("start_date", params.start_date);
  if (params?.end_date) url.searchParams.set("end_date", params.end_date);
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch health records");
  return res.json();
}

export async function getHealthRecordsByDate(date: string): Promise<HealthRecord[]> {
  const res = await fetch(`${BASE_URL}/health-records/${date}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch records");
  return res.json();
}

export async function updateHealthRecord(
  id: number,
  data: Partial<Pick<HealthRecord, "body_part" | "symptom_text" | "context_text" | "occurred_at">>
): Promise<HealthRecord> {
  const res = await fetch(`${BASE_URL}/health-records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update record");
  return res.json();
}

export interface StreamEvent {
  type: "text_delta" | "record_saved" | "done" | "error";
  text?: string;
  record_ids?: number[];
  conversation_id?: number;
  message?: string;
}

export async function streamMessage(
  conversationId: number,
  content: string,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to send message");

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (!data) continue;
        try {
          onEvent(JSON.parse(data) as StreamEvent);
        } catch {
          // ignore malformed lines
        }
      }
    }
  }
}

export async function createHealthRecord(data: {
  body_part: string;
  symptom_text: string;
  context_text?: string;
  occurred_at?: string;
}): Promise<HealthRecord> {
  const res = await fetch(`${BASE_URL}/health-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create record");
  return res.json();
}

export async function updateProfile(data: { age?: number | null; gender?: string | null }): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update profile");
}

export async function deleteHealthRecord(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/health-records/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete record");
}
