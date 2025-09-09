"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  return (
    <div className="min-h-screen bg-app text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <Link href="/" className="font-semibold">Smartrecruify</Link>
          <nav className="flex items-center gap-3">
            <Link href="/employment" className="hover:text-brand">Employment</Link>
            <Link href="/education" className="hover:text-brand">Education</Link>
            <Link href="/cv" className="hover:text-brand">CV Builder</Link>
            <Button variant="outline" onClick={() => setDark(v => !v)}>
              Toggle Theme
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
