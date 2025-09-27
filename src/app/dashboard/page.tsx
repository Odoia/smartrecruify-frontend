// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { endpoints } from "@/lib/endpoints";
// ✅ importe sempre do barrel
import { authHeader, refreshAccessToken } from "@/lib/auth";

import { AppCard } from "@/components/ui/app-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import UploadLinkedInPdfCard from "@/components/documents/UploadLinkedInPdfCard";

type EmploymentRecord = {
  id: number;
  company_name?: string;
  job_title?: string;
  started_on?: string;
  ended_on?: string | null;
};

type EducationRecord = {
  id: number;
  institution_name?: string;
  program_name?: string;
  degree_level?: string;
  started_on?: string;
  completed_on?: string | null;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [employment, setEmployment] = useState<EmploymentRecord[]>([]);
  const [education, setEducation] = useState<EducationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function safeFetch(url: string, init?: RequestInit) {
    let res = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", ...(init?.headers || {}), ...authHeader() },
      credentials: "include",
    });

    if (res.status === 401) {
      try {
        await refreshAccessToken();
        res = await fetch(url, {
          ...init,
          headers: { Accept: "application/json", ...(init?.headers || {}), ...authHeader() },
          credentials: "include",
        });
      } catch {
        // mantém 401
      }
    }
    return res;
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [empRes, eduRes] = await Promise.all([
          safeFetch(endpoints.employment.records),
          safeFetch(endpoints.education.records),
        ]);

        if (!empRes.ok) {
          const txt = await empRes.text();
          throw new Error(`Employment fetch failed: ${empRes.status} ${txt}`);
        }
        if (!eduRes.ok) {
          const txt = await eduRes.text();
          throw new Error(`Education fetch failed: ${eduRes.status} ${txt}`);
        }

        const empJson = (await empRes.json()) as EmploymentRecord[];
        const eduJson = (await eduRes.json()) as EducationRecord[];

        if (!mounted) return;
        setEmployment(Array.isArray(empJson) ? empJson : []);
        setEducation(Array.isArray(eduJson) ? eduJson : []);
      } catch (e: any) {
        if (!mounted) return;
        console.error(e);
        setError(e?.message || "Failed to load dashboard");
        toast.error("Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const hasEmployment = employment.length > 0;
  const hasEducation = education.length > 0;
  const completion = (Number(hasEmployment) + Number(hasEducation)) * 50;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your profile and what to complete next.
          </p>
        </div>
        <div className="hidden sm:flex gap-2">
          <Link href="/employment">
            <Button variant="outline">Manage Employment</Button>
          </Link>
          <Link href="/education">
            <Button variant="outline">Manage Education</Button>
          </Link>
        </div>
      </div>

      <AppCard className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium">Profile completion</h2>
            <p className="text-sm text-muted-foreground">
              Complete the steps below to generate a strong CV.
            </p>
          </div>
          <div className="min-w-[200px]">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>{completion}%</span>
              <span className="text-muted-foreground">complete</span>
            </div>
            <Progress value={completion} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius)] border border-border p-4 bg-card">
            <div className="flex items-center justify-between">
              <div className="font-medium">Employment</div>
              <Badge variant={hasEmployment ? "default" : "destructive"}>
                {hasEmployment ? "Complete" : "Missing"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasEmployment
                ? "You have at least one employment record."
                : "Add your employment history (company, role, dates, responsibilities)."}
            </p>
            <div className="mt-3">
              <Link href="/employment">
                <Button className="w-full sm:w-auto">
                  {hasEmployment ? "Review employment" : "Add employment"}
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-[var(--radius)] border border-border p-4 bg-card">
            <div className="flex items-center justify-between">
              <div className="font-medium">Education</div>
              <Badge variant={hasEducation ? "default" : "destructive"}>
                {hasEducation ? "Complete" : "Missing"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasEducation
                ? "You have at least one education record."
                : "Add your education (degree/program, institution, dates)."}
            </p>
            <div className="mt-3 flex gap-2 flex-wrap">
              <Link href="/education">
                <Button className="w-full sm:w-auto">
                  {hasEducation ? "Review education" : "Add education"}
                </Button>
              </Link>
              <Link href="/courses">
                <Button variant="outline" className="w-full sm:w-auto">
                  Browse courses
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </AppCard>

      <UploadLinkedInPdfCard />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
