// src/lib/auth/auth.ts
import { getAccessToken } from "./tokens";

export function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
