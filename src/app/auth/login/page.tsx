// src/app/auth/login/page.tsx
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

type SignInJson = {
  access_token?: string;
  refresh_token?: string;
  user?: { id: number; email: string; name?: string };
  error?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(endpoints.auth.signIn, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // se quiser permitir cookie de refresh
      });

      const headerAuth = parseAuthHeader(res.headers.get("authorization"));
      let json: SignInJson | undefined;
      try { json = await res.clone().json(); } catch {}

      if (!res.ok) {
        const msg = json?.error || `Invalid credentials (${res.status})`;
        toast.error(msg);
        return;
      }

      const accessToken = headerAuth || json?.access_token;
      saveTokens({ accessToken, refreshToken: json?.refresh_token });

      toast.success("Welcome back!");
      router.replace("/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <AppCard className="p-6">
        <h1 className="mb-1 text-2xl font-semibold">Log in</h1>
        <p className="mb-6 text-sm text-muted-foreground">Enter your credentials to continue.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Logging in..." : "Log in"}
          </Button>
        </form>
      </AppCard>
    </div>
  );
}
