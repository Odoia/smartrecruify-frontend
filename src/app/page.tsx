"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AppCard } from "@/components/ui/app-card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold">Welcome to Smartrecruify</h1>
          <p className="mt-2 text-sm opacity-80">
            Build your career profile, track education and employment, and generate tailored CVs.
          </p>
        </div>

        <AppCard className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Card de novo usuário */}
            <div className="flex flex-col justify-between rounded-2xl border border-border p-5">
              <div>
                <h2 className="text-lg font-medium">New here?</h2>
                <p className="mt-1 text-sm opacity-80">
                  Create your account to start building your profile.
                </p>
              </div>
              <Link href="/auth/register" className="mt-4">
                <Button className="w-full h-10">
                  Create account
                </Button>
              </Link>
            </div>

            {/* Card de login */}
            <div className="flex flex-col justify-between rounded-2xl border border-border p-5">
              <div>
                <h2 className="text-lg font-medium">Already have an account?</h2>
                <p className="mt-1 text-sm opacity-80">
                  Log in to continue.
                </p>
              </div>
              <Link href="/auth/login" className="mt-4">
                <Button variant="outline" className="w-full h-10">
                  Log in
                </Button>
              </Link>
            </div>
          </div>
        </AppCard>
      </div>
    </AppShell>
  );
}
