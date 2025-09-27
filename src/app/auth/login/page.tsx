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
  id?: number;
  email?: string;
  name?: string;
  role?: string;
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
        credentials: "include", // recebe cookie httpOnly de refresh
        body: JSON.stringify({ auth: { email, password } }),
      });

      const access = parseAuthHeader(res.headers.get("authorization"));
      const json = await res.clone().json().catch(() => ({} as SignInJson));

      if (!res.ok || !access) {
        const raw = await res.text().catch(() => "");
        toast.error(json?.error || raw || `Invalid credentials (${res.status})`);
        return;
      }

      saveTokens({ accessToken: access, refreshToken: json?.refresh_token });
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
        <p className="mb-6 text-sm text-muted-foreground">
          Enter your credentials to continue.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Logging in..." : "Log in"}
          </Button>
        </form>
      </AppCard>
    </div>
  );
}
