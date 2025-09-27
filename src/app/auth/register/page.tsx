// src/app/register/page.tsx
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

type AuthJson = {
  access_token?: string;
  refresh_token?: string;
  id?: number;
  email?: string;
  name?: string;
  role?: string;
  error?: string;
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
      // 1) SIGN UP (payload namespaced)
      const resSignUp = await fetch(endpoints.auth.signUp, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ auth: { email, password, name } }),
      });

      if (!resSignUp.ok) {
        const body = (await resSignUp.clone().json().catch(() => null)) as AuthJson | null;
        const raw = await resSignUp.text().catch(() => "");
        toast.error(body?.error || raw || `Sign up failed (${resSignUp.status})`);
        return;
      }

      // 2) SIGN IN para obter Authorization header (access) e cookie httpOnly (refresh)
      const resSignIn = await fetch(endpoints.auth.signIn, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ auth: { email, password } }),
      });

      const access = parseAuthHeader(resSignIn.headers.get("authorization"));
      const jsonSignIn = (await resSignIn.clone().json().catch(() => ({}))) as AuthJson;

      if (!resSignIn.ok || !access) {
        const raw = await resSignIn.text().catch(() => "");
        toast.error(jsonSignIn?.error || raw || `Sign in failed (${resSignIn.status})`);
        return;
      }

      // 3) salva access no storage; refresh vem via cookie httpOnly
      saveTokens({ accessToken: access, refreshToken: jsonSignIn?.refresh_token });

      toast.success("Account created! You’re signed in.");
      router.replace("/dashboard");
    } catch (err: any) {
      console.error("Register error:", err);
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
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Creating..." : "Create account"}
          </Button>
        </form>
      </AppCard>
    </div>
  );
}
