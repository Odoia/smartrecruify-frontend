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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

// ---- Types ----
type EducationRecord = {
  id: number;
  degree_level?: string | null;
  institution_name?: string | null;
  program_name?: string | null;
  started_on?: string | null;
  ended_on?: string | null;
  expected_end_on?: string | null;
  status?: string | null;
  gpa?: number | null;
  transcript_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

// ---- Options ----
const DEGREE_LEVELS = [
  "high_school",
  "associate",
  "bachelor",
  "master",
  "doctorate",
  "bootcamp",
  "certification",
  "course",
  "other",
];

const STATUSES = ["in_progress", "completed", "dropped", "paused"];

// helper para humanizar labels (ex.: "in_progress" -> "In Progress")
const humanize = (s: string) =>
  s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ---- Page ----
export default function EducationPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<EducationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  // dialog state
  const [open, setOpen] = useState(false);

  // form state
  const [degreeLevel, setDegreeLevel] = useState<string>("bachelor");
  const [institutionName, setInstitutionName] = useState("");
  const [programName, setProgramName] = useState("");
  const [startedOn, setStartedOn] = useState("");
  const [expectedEndOn, setExpectedEndOn] = useState("");
  const [status, setStatus] = useState<string>("in_progress");
  const [gpa, setGpa] = useState<string>("");
  const [transcriptUrl, setTranscriptUrl] = useState("");
  const [notes, setNotes] = useState("");
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
      const res = await safeFetch(endpoints.education.records);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to fetch education records: ${res.status} ${txt}`);
      }
      const json = (await res.json()) as EducationRecord[];
      setRecords(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load education records");
      toast.error("Failed to load education records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    // in-progress [48;79;156;1343;1248tprimeiro; depois por data desc (expected_end_on/ended_on/started_on)
    const rankStatus = (s?: string | null) =>
      s === "in_progress" ? 2 : s === "completed" ? 1 : 0;

    return [...records].sort((a, b) => {
      const rs = rankStatus(b.status) - rankStatus(a.status);
      if (rs !== 0) return rs;

      const bDate = b.expected_end_on || b.ended_on || b.started_on || "";
      const aDate = a.expected_end_on || a.ended_on || a.started_on || "";
      return (bDate || "").localeCompare(aDate || "");
    });
  }, [records]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // validações mínimas do frontend
      if (!programName.trim()) {
        toast.error("Program name is required");
        setSubmitting(false);
        return;
      }
      if (!institutionName.trim()) {
        toast.error("Institution is required");
        setSubmitting(false);
        return;
      }

      // convert gpa to number/null
      const gpaNumber =
        gpa.trim() === "" ? null : Number.isNaN(Number(gpa)) ? null : Number(gpa);

      const payload = {
        education_record: {
          degree_level: degreeLevel || null,
          institution_name: institutionName,
          program_name: programName, // obrigatório
          started_on: startedOn || null,
          expected_end_on: expectedEndOn || null,
          status: status || null,
          gpa: gpaNumber,
          transcript_url: transcriptUrl || null,
          // description: notes || null, // caso exista no modelo
        },
      };

      const res = await safeFetch(endpoints.education.records, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 422) {
          const text = await res.text();
          try {
            const parsed = JSON.parse(text);
            const details: string[] =
              parsed?.details || [parsed?.error || "Unprocessable Content"];
            toast.error(details.join("\n"));
          } catch {
            toast.error(text || "Validation failed (422)");
          }
        } else {
          const raw = await res.text();
          toast.error(raw || `Create failed (${res.status})`);
        }
        throw new Error(`HTTP ${res.status}`);
      }

      toast.success("Education record created");
      setOpen(false);
      // reset form
      setDegreeLevel("bachelor");
      setInstitutionName("");
      setProgramName("");
      setStartedOn("");
      setExpectedEndOn("");
      setStatus("in_progress");
      setGpa("");
      setTranscriptUrl("");
      setNotes("");

      await loadRecords();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Education</h1>
          <p className="text-sm text-muted-foreground">
            Manage your education background and training.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add education</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add education record</DialogTitle>
              <DialogDescription>
                Add your formal education or training program.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Degree level */}
                <div className="space-y-2">
                  <Label>Degree level</Label>
                  <Select value={degreeLevel} onValueChange={setDegreeLevel}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Select degree level" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      side="bottom"
                      align="start"
                      sideOffset={8}
                      className="z-[70] w-[var(--radix-select-trigger-width)] max-h-64 overflow-y-auto rounded-md border border-border bg-card text-card-foreground shadow-lg"
                    >
                      {DEGREE_LEVELS.map((lvl) => (
                        <SelectItem
                          key={lvl}
                          value={lvl}
                          className="cursor-pointer px-3 py-2 text-sm focus:bg-muted"
                        >
                          {humanize(lvl)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Institution */}
                <div className="space-y-2">
                  <Label htmlFor="institution_name">Institution</Label>
                  <Input
                    id="institution_name"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    required
                  />
                </div>

                {/* Program (obrigatório) */}
                <div className="space-y-2">
                  <Label htmlFor="program_name">Program</Label>
                  <Input
                    id="program_name"
                    value={programName}
                    onChange={(e) => setProgramName(e.target.value)}
                    placeholder="Computer Science, Data Analytics, ..."
                    required
                  />
                </div>

                {/* Start date */}
                <div className="space-y-2">
                  <Label htmlFor="started_on">Start date</Label>
                  <Input
                    id="started_on"
                    type="date"
                    value={startedOn}
                    onChange={(e) => setStartedOn(e.target.value)}
                  />
                </div>

                {/* Expected end date */}
                <div className="space-y-2">
                  <Label htmlFor="expected_end_on">Expected end date</Label>
                  <Input
                    id="expected_end_on"
                    type="date"
                    value={expectedEndOn}
                    onChange={(e) => setExpectedEndOn(e.target.value)}
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      side="bottom"
                      align="start"
                      sideOffset={8}
                      className="z-[70] w-[var(--radix-select-trigger-width)] max-h-64 overflow-y-auto rounded-md border border-border bg-card text-card-foreground shadow-lg"
                    >
                      {STATUSES.map((s) => (
                        <SelectItem
                          key={s}
                          value={s}
                          className="cursor-pointer px-3 py-2 text-sm focus:bg-muted"
                        >
                          {humanize(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* GPA */}
                <div className="space-y-2">
                  <Label htmlFor="gpa">GPA (optional)</Label>
                  <Input
                    id="gpa"
                    inputMode="decimal"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    placeholder="e.g., 3.8 or 9.2"
                  />
                </div>

                {/* Transcript URL */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="transcript_url">Transcript URL (optional)</Label>
                  <Input
                    id="transcript_url"
                    value={transcriptUrl}
                    onChange={(e) => setTranscriptUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Optional notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any relevant notes."
                  rows={3}
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
        <h2 className="text-lg font-medium">Your education records</h2>

        {loading && <p className="mt-2 text-sm text-muted-foreground">Loading...</p>}

        {!loading && records.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have any education records yet.
          </p>
        )}

        {!loading && records.length > 0 && (
          <ul className="mt-3 space-y-3">
            {sorted.map((r) => {
              const label =
                r.program_name || r.degree_level?.replaceAll("_", " ") || "Program";
              const inst = r.institution_name || "Institution";
              const period =
                r.expected_end_on || r.ended_on
                  ? `${r.started_on ?? ""} – ${r.expected_end_on ?? r.ended_on ?? ""}`
                  : r.started_on || "";

              return (
                <li key={r.id} className="rounded border border-border p-4 bg-card">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-muted-foreground">
                        {inst} {period ? `· ${period}` : ""}
                      </div>
                    </div>
                    <div>
                      {r.status ? (
                        <Badge variant={r.status === "in_progress" ? "default" : "secondary"}>
                          {humanize(r.status)}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {typeof r.gpa === "number" ? (
                    <p className="mt-2 text-sm text-muted-foreground">GPA: {r.gpa}</p>
                  ) : null}

                  {r.transcript_url ? (
                    <p className="mt-1 text-xs">
                      <a
                        className="underline opacity-80 hover:opacity-100"
                        href={r.transcript_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Transcript
                      </a>
                    </p>
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
