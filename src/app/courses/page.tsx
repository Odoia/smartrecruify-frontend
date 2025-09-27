// src/app/courses/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { endpoints } from "@/lib/endpoints";
import { authHeader } from "@/lib/auth/auth";
import { refreshAccessToken } from "@/lib/auth/refresh";

import { AppCard } from "@/components/ui/app-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Course = {
  id: number;
  name: string;
  description?: string | null;
  provider?: string | null;
  url?: string | null;
  category?: string | null;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state para filtros
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  // monta a URL com filtros no padrão ?filter[query]=...&filter[category]=...&page=...
  const listUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (query) params.set("filter[query]", query);
    if (category) params.set("filter[category]", category);
    if (page > 1) params.set("page", String(page));
    return `${endpoints.education.courses}?${params.toString()}`;
  }, [query, category, page]);

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
        // deixa propagar o 401
      }
    }
    return res;
  }

  async function loadCourses() {
    setLoading(true);
    setError(null);
    try {
      const res = await safeFetch(listUrl);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to fetch courses: ${res.status} ${txt}`);
      }
      const json = (await res.json()) as Course[]; // backend já retorna array simples
      setCourses(Array.isArray(json) ? json : []);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load courses");
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listUrl]);

  async function enroll(courseId: number) {
    try {
      const res = await safeFetch(endpoints.education.enrollments, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          course_enrollment: {
            course_id: courseId,
            status: "in_progress", // ou "enrolled" — a sua API aceita ambos
          },
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Enroll failed: ${res.status} ${txt}`);
      }
      toast.success("Enrolled!");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to enroll");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Courses</h1>
      <p className="text-sm text-muted-foreground">Browse available courses to complement your education.</p>

      {/* Filtros */}
      <AppCard className="p-4">
        <div className="grid gap-3 sm:grid-cols-3 items-end">
          <div className="sm:col-span-2">
            <Label htmlFor="q">Search</Label>
            <Input
              id="q"
              placeholder="Search by name or provider…"
              value={query}
              onChange={(e) => {
                setPage(1);
                setQuery(e.target.value);
              }}
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={category ?? ""}
              onValueChange={(v) => {
                setPage(1);
                setCategory(v || undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                {/* adicione outras categorias se quiser */}
              </SelectContent>
            </Select>
          </div>
        </div>
      </AppCard>

      {loading && <p className="text-sm text-muted-foreground">Loading courses...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && courses.length === 0 && <p className="text-sm text-muted-foreground">No courses found.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((c) => (
          <AppCard key={c.id} className="p-4 space-y-2">
            <h2 className="font-medium">{c.name}</h2>
            {c.provider && <p className="text-xs text-muted-foreground">Provider: {c.provider}</p>}
            {c.description && <p className="text-sm text-muted-foreground line-clamp-3">{c.description}</p>}
            <div className="flex gap-2">
              {c.url && (
                <a href={c.url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm">Visit</Button>
                </a>
              )}
              <Button size="sm" onClick={() => enroll(c.id)}>Enroll</Button>
            </div>
          </AppCard>
        ))}
      </div>

      {/* Paginação simples (opcional) */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
