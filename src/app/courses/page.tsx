"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { endpoints } from "@/lib/endpoints";
import { authHeader } from "@/lib/auth";
import { refreshAccessToken } from "@/lib/session";

import { AppCard } from "@/components/ui/app-card";
import { Button } from "@/components/ui/button";

type Course = {
  id: number;
  name: string;
  description?: string | null;
  provider?: string | null;
  url?: string | null;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
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
        // segue 401
      }
    }
    return res;
  }

  async function loadCourses() {
    setLoading(true);
    setError(null);
    try {
      const res = await safeFetch(endpoints.education.courses);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to fetch courses: ${res.status} ${txt}`);
      }
      const json = (await res.json()) as Course[];
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
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Courses</h1>
      <p className="text-sm text-muted-foreground">
        Browse available courses to complement your education.
      </p>

      {loading && <p className="text-sm text-muted-foreground">Loading courses...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && courses.length === 0 && (
        <p className="text-sm text-muted-foreground">No courses available.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((c) => (
          <AppCard key={c.id} className="p-4 space-y-2">
            <h2 className="font-medium">{c.name}</h2>
            {c.provider && (
              <p className="text-xs text-muted-foreground">Provider: {c.provider}</p>
            )}
            {c.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">{c.description}</p>
            )}
            <div className="flex gap-2">
              {c.url && (
                <a href={c.url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm">
                    Visit
                  </Button>
                </a>
              )}
              <Button size="sm">Enroll</Button>
            </div>
          </AppCard>
        ))}
      </div>
    </div>
  );
}
