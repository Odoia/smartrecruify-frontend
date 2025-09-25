"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { endpoints } from "@/lib/endpoints";
import { authHeader } from "@/lib/auth";
import { refreshAccessToken } from "@/lib/session";

import { AppCard } from "@/components/ui/app-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

type EmploymentRecord = {
  id: number;
  company_name?: string;
  job_title?: string;
  location?: string;
  started_on?: string;           // ISO date
  ended_on?: string | null;      // ISO date or null
  current?: boolean;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function EmploymentPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<EmploymentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  // dialog state
  const [open, setOpen] = useState(false);

  // form state
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startedOn, setStartedOn] = useState("");
  const [current, setCurrent] = useState(true);
  const [endedOn, setEndedOn] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        // deixa seguir 401
      }
    }
    return res;
  }

  async function loadRecords() {
    setLoading(true);
    setError(null);
    try {
      const res = await safeFetch(endpoints.employment.records);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to fetch employment records: ${res.status} ${txt}`);
      }
      const json = (await res.json()) as EmploymentRecord[];
      setRecords(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load employment records");
      toast.error("Failed to load employment records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    // atuais primeiro; depois os mais recentes
    return [...records].sort((a, b) => {
      const aCurrent = a.current ? 1 : 0;
      const bCurrent = b.current ? 1 : 0;
      if (aCurrent !== bCurrent) return bCurrent - aCurrent;

      const aDate = a.ended_on || a.started_on || "";
      const bDate = b.ended_on || b.started_on || "";
      return (bDate || "").localeCompare(aDate || "");
    });
  }, [records]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // ended_on deve ser null quando "current" está ativo
      const ended = current ? null : (endedOn || null);

      const payload = {
        employment_record: {
          company_name: companyName,
          job_title: jobTitle,
          location: location || null,
          started_on: startedOn,     // "YYYY-MM-DD"
          ended_on: ended,           // null ou "YYYY-MM-DD"
          current,
          description: description || null,
        },
      };

      const res = await safeFetch(endpoints.employment.records, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const raw = await res.text();
        throw new Error(raw || `Create failed (${res.status})`);
      }

      toast.success("Employment created");
      setOpen(false);
      // limpa form
      setCompanyName("");
      setJobTitle("");
      setLocation("");
      setStartedOn("");
      setCurrent(true);
      setEndedOn("");
      setDescription("");

      await loadRecords();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to create employment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employment</h1>
          <p className="text-sm text-muted-foreground">
            Manage your employment history and roles.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add employment</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add employment</DialogTitle>
              <DialogDescription>
                Add your employment record. You can add detailed experiences after salvar.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company</Label>
                  <Input
                    id="company_name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title / Role</Label>
                  <Input
                    id="job_title"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Remote, São Paulo, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="started_on">Start date</Label>
                  <Input
                    id="started_on"
                    type="date"
                    value={startedOn}
                    onChange={(e) => setStartedOn(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current">Currently working here?</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="current"
                      type="checkbox"
                      checked={current}
                      onChange={(e) => setCurrent(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="current" className="text-sm text-muted-foreground">
                      Yes, this is my current job
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ended_on">End date</Label>
                  <Input
                    id="ended_on"
                    type="date"
                    value={endedOn}
                    onChange={(e) => setEndedOn(e.target.value)}
                    disabled={current}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Main responsibilities or summary."
                  rows={4}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      <AppCard className="p-5">
        <h2 className="text-lg font-medium">Your employment records</h2>

        {loading && (
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        )}

        {!loading && records.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have any employment records yet.
          </p>
        )}

        {!loading && records.length > 0 && (
          <ul className="mt-3 space-y-3">
            {sorted.map((r) => {
              const period = r.current
                ? `${r.started_on ?? ""} – Present`
                : `${r.started_on ?? ""} – ${r.ended_on ?? ""}`;

              return (
                <li key={r.id} className="rounded border border-border p-4 bg-card">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {r.job_title || "Role"} {r.company_name ? `· ${r.company_name}` : ""}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {period} {r.location ? `· ${r.location}` : ""}
                      </div>
                    </div>
                    <div>
                      {r.current ? (
                        <Badge>Current</Badge>
                      ) : (
                          <Badge variant="secondary">Past</Badge>
                        )}
                    </div>
                  </div>

                  {r.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </AppCard>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
