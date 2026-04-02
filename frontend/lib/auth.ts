const TOKEN_KEY = "health_jwt";
const USER_ID_KEY = "health_user_id";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ID_KEY);
}

export function setStoredUserId(userId: number): void {
  localStorage.setItem(USER_ID_KEY, String(userId));
}

export function clearStoredUserId(): void {
  localStorage.removeItem(USER_ID_KEY);
}
