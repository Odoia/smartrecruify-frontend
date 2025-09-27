// src/lib/auth/tokens.ts
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("access_token", token);
  else localStorage.removeItem("access_token");
}

export function parseAuthHeader(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const m = headerValue.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export function saveTokens(opts: { accessToken?: string | null }) {
  if (opts.accessToken !== undefined) setAccessToken(opts.accessToken);
}
