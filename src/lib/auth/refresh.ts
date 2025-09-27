// src/lib/auth/refresh.ts
import { parseAuthHeader, saveTokens } from "./tokens";
import { endpoints } from "@/lib/endpoints";

let inflight: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (!inflight) {
    inflight = (async () => {
      const res = await fetch(endpoints.auth.refresh, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        saveTokens({ accessToken: null });
        throw new Error(`Failed to refresh token (${res.status})`);
      }

      const headerAuth = parseAuthHeader(res.headers.get("authorization"));
      if (!headerAuth) {
        let json: any = null;
        try { json = await res.clone().json(); } catch {}
        const bodyToken = json?.access_token as string | undefined;
        if (!bodyToken) throw new Error("refresh_no_token");
        saveTokens({ accessToken: bodyToken });
        return bodyToken;
      }

      saveTokens({ accessToken: headerAuth });
      return headerAuth;
    })().finally(() => { inflight = null; });
  }
  return inflight;
}
