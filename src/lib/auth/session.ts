// src/lib/auth/session.ts
import { refreshAccessToken } from "./refresh";

let inflight: Promise<string> | null = null;

export async function ensureFreshAccessToken(): Promise<string> {
  if (!inflight) {
    inflight = refreshAccessToken().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}
