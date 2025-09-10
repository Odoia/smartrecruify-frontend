// src/lib/auth.ts
export type AuthTokens = {
  accessToken?: string;
  refreshToken?: string; // se em JSON (fallback)
};

export function parseAuthHeader(h: string | null): string | undefined {
  if (!h) return;
  // Aceita "Bearer xxx" ou só "xxx"
  const parts = h.trim().split(/\s+/);
  return parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : parts[0];
}

export function saveTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") return;
  if (tokens.accessToken) localStorage.setItem("access_token", tokens.accessToken);
  if (tokens.refreshToken) localStorage.setItem("refresh_token", tokens.refreshToken);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function authHeader(): HeadersInit {
  const t = getAccessToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
