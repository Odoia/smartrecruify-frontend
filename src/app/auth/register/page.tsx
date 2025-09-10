"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { endpoints } from "@/lib/endpoints";
import { parseAuthHeader, saveTokens } from "@/lib/auth";
import { AppCard } from "@/components/ui/app-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignUpJson = {
  access_token?: string;
  refresh_token?: string;
  user?: { id: number; email: string; name?: string };
  error?: string;
  details?: unknown;
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Dica: loga endpoint para garantir que NEXT_PUBLIC_API_URL foi lido
      console.log("POST", endpoints.auth.signUp);

      const res = await fetch(endpoints.auth.signUp, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        // Sua API aceita corpo plano (igual Insomnia), sem wrapper "user"
        body: JSON.stringify({ email, password, name }),
        // Se a API definir/usar cookie httpOnly (refresh), inclua credenciais
        credentials: "include",
      });

      const authHeader = parseAuthHeader(res.headers.get("authorization"));

      let json: SignUpJson | undefined;
      try {
        json = await res.clone().json();
      } catch {
        // se a API não retornar JSON, segue só com o header
      }

      if (!res.ok) {
        // Mostra texto bruto quando possível, ajuda no debug
        const raw = await res.text();
        const msg = json?.error || raw || `Sign up failed (${res.status})`;
        console.error("SignUp error:", msg);
        toast.error(typeof msg === "string" ? msg : "Registration failed");
        return;
      }

      const accessToken = authHeader || json?.access_token;
      saveTokens({ accessToken, refreshToken: json?.refresh_token });

      toast.success("Account created!");
      router.replace("/employment"); // ajuste o redirect se quiser
    } catch (err: any) {
      console.error("SignUp exception:", err);
      toast.error(err?.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <AppCard className="p-6">
        <h1 className="mb-1 text-2xl font-semibold">Create your account</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Fill in the details below to get started.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Creating..." : "Create account"}
          </Button>
        </form>
      </AppCard>
    </div>
  );
}
