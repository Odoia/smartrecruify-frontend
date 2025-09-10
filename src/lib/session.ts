import { endpoints } from "@/lib/endpoints";
import { authHeader, parseAuthHeader, saveTokens } from "@/lib/auth";

/**
 * Chama a API /auth/refresh para girar um novo access token.
 * Usa o cookie httpOnly `refresh_token` (por isso precisa de credentials: "include").
 */
export async function refreshAccessToken() {
  const res = await fetch(endpoints.auth.refresh, {
    method: "POST",
    credentials: "include", // envia refresh_token armazenado no cookie
  });

  const headerAuth = parseAuthHeader(res.headers.get("authorization"));

  if (!res.ok || !headerAuth) {
    throw new Error("Failed to refresh token");
  }

  saveTokens({ accessToken: headerAuth });
  return headerAuth;
}

/**
 * Faz logout chamando:
 * - DELETE /auth/sign_out (invalida access token)
 * - DELETE /auth/refresh (revoga refresh)
 */
export async function signOut() {
  // encerra sessão do access token
  await fetch(endpoints.auth.signOut, {
    method: "DELETE",
    headers: { ...authHeader() },
  });

  // revoga o refresh token também
  await fetch(endpoints.auth.revoke, {
    method: "DELETE",
    headers: { ...authHeader() },
    credentials: "include",
  });

  // limpa storage local
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
