"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ---------- Types ----------

type EmploymentRecord = {
  id?: number;
  company_name?: string;
  job_title?: string;
  started_on?: string; // YYYY-MM-DD
  ended_on?: string | null;
  current?: boolean;
  job_description?: string | null;
  responsibilities?: string | null;
};

type EducationRecord = {
  id?: number;
  institution_name?: string;
  program_name?: string;
  degree_level?: string | null; // enum key
  started_on?: string | null;
  expected_end_on?: string | null;
  completed_on?: string | null;
  status?: string | null; // enum key
  gpa?: number | string | null;
  transcript_url?: string | null;
};

type LanguageSkill = {
  id?: number;
  language?: string; // enum key
  level?: string;    // enum key
};

// ---------- Helpers ----------

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
      // ignore
    }
  }
  return res;
}

const DEGREE_OPTIONS = [
  "default", "primary", "secondary", "high_school",
  "vocational", "associate", "bachelor", "postgraduate", "master", "doctorate",
];

const STATUS_OPTIONS = [
  "default", "enrolled", "in_progress", "completed", "paused", "dropped",
];

const LANGUAGE_OPTIONS = [
  "default", "english", "spanish", "portuguese_brazil", "portuguese_portugal", "french",
];

const LEVEL_OPTIONS = [
  "default", "beginner", "elementary", "intermediate", "upper_intermediate", "advanced", "proficient",
];

function titleizeEnumKey(k?: string | null) {
  if (!k) return "";
  return k
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

// ---------- Page ----------

export default function ProfileReviewPage() {
  const router = useRouter();

  // server data
  const [loading, setLoading] = useState(true);
  const [employment, setEmployment] = useState<EmploymentRecord[]>([]);
  const [education, setEducation] = useState<EducationRecord[]>([]);
  const [languages, setLanguages] = useState<LanguageSkill[]>([]);
  const [error, setError] = useState<string | null>(null);

  // drafts
  const [empDrafts, setEmpDrafts] = useState<Record<number, EmploymentRecord>>({});
  const [eduDrafts, setEduDrafts] = useState<Record<number, EducationRecord>>({});
  const [langDrafts, setLangDrafts] = useState<Record<number, LanguageSkill>>({});

  // new rows
  const [empNew, setEmpNew] = useState<EmploymentRecord>({
    company_name: "",
    job_title: "",
    started_on: "",
    ended_on: null,
    current: false,
    job_description: "",
    responsibilities: "",
  });

  const [eduNew, setEduNew] = useState<EducationRecord>({
    institution_name: "",
    program_name: "",
    degree_level: "default",
    started_on: null,
    expected_end_on: null,
    completed_on: null,
    status: "default",
    gpa: null,
    transcript_url: null,
  });

  const [langNew, setLangNew] = useState<LanguageSkill>({
    language: "default",
    level: "default",
  });

  // Load everything
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [empRes, eduRes, langRes] = await Promise.all([
          safeFetch(endpoints.employment.records),
          safeFetch(endpoints.education.records),
          safeFetch(endpoints.education.languageSkills),
        ]);

        if (!empRes.ok) throw new Error(`Employment fetch failed: ${empRes.status} ${await empRes.text()}`);
        if (!eduRes.ok) throw new Error(`Education fetch failed: ${eduRes.status} ${await eduRes.text()}`);
        if (!langRes.ok) throw new Error(`Language fetch failed: ${langRes.status} ${await langRes.text()}`);

        const empJson = (await empRes.json()) as EmploymentRecord[];
        const eduJson = (await eduRes.json()) as EducationRecord[];
        const langJson = (await langRes.json()) as LanguageSkill[];

        if (!mounted) return;
        setEmployment(Array.isArray(empJson) ? empJson : []);
        setEducation(Array.isArray(eduJson) ? eduJson : []);
        setLanguages(Array.isArray(langJson) ? langJson : []);

        const empD: Record<number, EmploymentRecord> = {};
        (empJson || []).forEach((r) => { if (r.id != null) empD[r.id] = { ...r }; });
        setEmpDrafts(empD);

        const eduD: Record<number, EducationRecord> = {};
        (eduJson || []).forEach((r) => { if (r.id != null) eduD[r.id] = { ...r }; });
        setEduDrafts(eduD);

        const langD: Record<number, LanguageSkill> = {};
        (langJson || []).forEach((r) => { if (r.id != null) langD[r.id] = { ...r }; });
        setLangDrafts(langD);
      } catch (e: any) {
        if (!mounted) return;
        console.error(e);
        setError(e?.message || "Failed to load profile data");
        toast.error("Failed to load profile data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // -------- EMPLOYMENT actions ----------
  async function saveEmployment(id: number) {
    const draft = empDrafts[id];
    if (!draft) return;
    try {
      const res = await safeFetch(`${endpoints.employment.records}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employment_record: draft }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      toast.success("Employment updated");
      setEmployment((prev) => prev.map((r) => (r.id === id ? json : r)));
      setEmpDrafts((prev) => ({ ...prev, [id]: json }));
    } catch (e: any) {
      toast.error(e?.message || "Failed to update employment");
    }
  }

  async function deleteEmployment(id: number) {
    if (!confirm("Delete this employment record?")) return;
    try {
      const res = await safeFetch(`${endpoints.employment.records}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
      toast.success("Employment deleted");
      setEmployment((prev) => prev.filter((r) => r.id !== id));
      setEmpDrafts((prev) => { const c = { ...prev }; delete c[id]; return c; });
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete employment");
    }
  }

  async function createEmployment() {
    const payload = { ...empNew };
    try {
      const res = await safeFetch(endpoints.employment.records, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employment_record: payload }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      toast.success("Employment created");
      setEmployment((p) => [json, ...p]);
      if (json?.id != null) setEmpDrafts((prev) => ({ ...prev, [json.id]: { ...json } }));
      setEmpNew({
        company_name: "", job_title: "", started_on: "", ended_on: null, current: false,
        job_description: "", responsibilities: "",
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to create employment");
    }
  }

  function setEmpField(id: number, key: keyof EmploymentRecord, value: any) {
    setEmpDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  }

  // -------- EDUCATION actions ----------
  async function saveEducation(id: number) {
    const draft = eduDrafts[id];
    if (!draft) return;
    try {
      const res = await safeFetch(`${endpoints.education.records}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ education_record: draft }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      toast.success("Education updated");
      setEducation((prev) => prev.map((r) => (r.id === id ? json : r)));
      setEduDrafts((prev) => ({ ...prev, [id]: json }));
    } catch (e: any) {
      toast.error(e?.message || "Failed to update education");
    }
  }

  async function deleteEducation(id: number) {
    if (!confirm("Delete this education record?")) return;
    try {
      const res = await safeFetch(`${endpoints.education.records}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
      toast.success("Education deleted");
      setEducation((prev) => prev.filter((r) => r.id !== id));
      setEduDrafts((prev) => { const c = { ...prev }; delete c[id]; return c; });
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete education");
    }
  }

  async function createEducation() {
    const payload = { ...eduNew };
    try {
      const res = await safeFetch(endpoints.education.records, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ education_record: payload }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      toast.success("Education created");
      setEducation((p) => [json, ...p]);
      if (json?.id != null) setEduDrafts((prev) => ({ ...prev, [json.id]: { ...json } }));
      setEduNew({
        institution_name: "",
        program_name: "",
        degree_level: "default",
        started_on: null,
        expected_end_on: null,
        completed_on: null,
        status: "default",
        gpa: null,
        transcript_url: null,
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to create education");
    }
  }

  function setEduField(id: number, key: keyof EducationRecord, value: any) {
    setEduDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  }

  // -------- LANGUAGE actions ----------
  async function saveLanguage(id: number) {
    const draft = langDrafts[id];
    if (!draft) return;
    try {
      const res = await safeFetch(`${endpoints.education.languageSkills}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language_skill: draft }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      toast.success("Language updated");
      setLanguages((prev) => prev.map((r) => (r.id === id ? json : r)));
      setLangDrafts((prev) => ({ ...prev, [id]: json }));
    } catch (e: any) {
      toast.error(e?.message || "Failed to update language");
    }
  }

  async function deleteLanguage(id: number) {
    if (!confirm("Delete this language?")) return;
    try {
      const res = await safeFetch(`${endpoints.education.languageSkills}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
      toast.success("Language deleted");
      setLanguages((prev) => prev.filter((r) => r.id !== id));
      setLangDrafts((prev) => { const c = { ...prev }; delete c[id]; return c; });
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete language");
    }
  }

  async function createLanguage() {
    const payload = { ...langNew };
    try {
      const res = await safeFetch(endpoints.education.languageSkills, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language_skill: payload }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      toast.success("Language created");
      setLanguages((p) => [json, ...p]);
      if (json?.id != null) setLangDrafts((prev) => ({ ...prev, [json.id]: { ...json } }));
      setLangNew({ language: "default", level: "default" });
    } catch (e: any) {
      toast.error(e?.message || "Failed to create language");
    }
  }

  function setLangField(id: number, key: keyof LanguageSkill, value: any) {
    setLangDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  }

  // ---------- UI ----------

  const hasEmployment = employment.length > 0;
  const hasEducation = education.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Review & Edit</h1>
          <p className="text-sm text-muted-foreground">
            Your data was imported and saved. Review and edit below.
          </p>
        </div>
        <div className="hidden sm:flex gap-2">
          <Link href="/employment">
            <Button variant="outline">Employment manager</Button>
          </Link>
          <Link href="/education">
            <Button variant="outline">Education manager</Button>
          </Link>
        </div>
      </div>

      <AppCard className="p-5">
        <Tabs defaultValue="employment" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto">
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
          </TabsList>

          {/* EMPLOYMENT TAB */}
          <TabsContent value="employment" className="space-y-6 pt-4">
            <section className="rounded border border-border p-4">
              <h3 className="font-medium mb-3">Add employment</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Company</Label>
                  <Input
                    value={empNew.company_name ?? ""}
                    onChange={(e) => setEmpNew((s) => ({ ...s, company_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Job title</Label>
                  <Input
                    value={empNew.job_title ?? ""}
                    onChange={(e) => setEmpNew((s) => ({ ...s, job_title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Started on</Label>
                  <Input
                    type="date"
                    value={empNew.started_on ?? ""}
                    onChange={(e) => setEmpNew((s) => ({ ...s, started_on: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Ended on</Label>
                  <Input
                    type="date"
                    value={empNew.ended_on ?? ""}
                    onChange={(e) => setEmpNew((s) => ({ ...s, ended_on: e.target.value || null }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Current</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant={empNew.current ? "default" : "outline"}
                      onClick={() => setEmpNew((s) => ({ ...s, current: !s.current }))}
                      className="h-8"
                    >
                      {empNew.current ? "Yes (current job)" : "No"}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      If current = Yes, ended_on will be ignored.
                    </span>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label>Job description</Label>
                  <Textarea
                    rows={3}
                    value={empNew.job_description ?? ""}
                    onChange={(e) => setEmpNew((s) => ({ ...s, job_description: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Responsibilities (one per line)</Label>
                  <Textarea
                    rows={3}
                    value={empNew.responsibilities ?? ""}
                    onChange={(e) =>
                      setEmpNew((s) => ({ ...s, responsibilities: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={createEmployment}>Create</Button>
              </div>
            </section>

            <Separator className="my-4" />

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Your employment records</h3>
                <Badge variant="secondary">{employment.length}</Badge>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : !hasEmployment ? (
                <p className="text-sm text-muted-foreground">No employment records yet.</p>
              ) : (
                employment.map((r) => {
                  const id = r.id as number;
                  const d = empDrafts[id] ?? r;
                  return (
                    <div key={id} className="rounded border border-border p-4 bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {d.job_title || "Role"} — {d.company_name || "Company"}
                        </div>
                        <Badge variant={d.current ? "default" : "outline"}>
                          {d.current ? "Current" : "Past"}
                        </Badge>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Company</Label>
                          <Input
                            value={d.company_name ?? ""}
                            onChange={(e) => setEmpField(id, "company_name", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Job title</Label>
                          <Input
                            value={d.job_title ?? ""}
                            onChange={(e) => setEmpField(id, "job_title", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Started on</Label>
                          <Input
                            type="date"
                            value={d.started_on ?? ""}
                            onChange={(e) => setEmpField(id, "started_on", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Ended on</Label>
                          <Input
                            type="date"
                            value={d.ended_on ?? ""}
                            onChange={(e) => setEmpField(id, "ended_on", e.target.value || null)}
                            disabled={!!d.current}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label>Current</Label>
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant={d.current ? "default" : "outline"}
                              onClick={() => setEmpField(id, "current", !d.current)}
                              className="h-8"
                            >
                              {d.current ? "Yes (current job)" : "No"}
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              If current = Yes, ended_on will be ignored.
                            </span>
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <Label>Job description</Label>
                          <Textarea
                            rows={3}
                            value={d.job_description ?? ""}
                            onChange={(e) => setEmpField(id, "job_description", e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label>Responsibilities (one per line)</Label>
                          <Textarea
                            rows={3}
                            value={d.responsibilities ?? ""}
                            onChange={(e) => setEmpField(id, "responsibilities", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => saveEmployment(id)}>Save</Button>
                        <Button variant="destructive" onClick={() => deleteEmployment(id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          </TabsContent>

          {/* EDUCATION TAB */}
          <TabsContent value="education" className="space-y-6 pt-4">
            <section className="rounded border border-border p-4">
              <h3 className="font-medium mb-3">Add education</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Institution</Label>
                  <Input
                    value={eduNew.institution_name ?? ""}
                    onChange={(e) =>
                      setEduNew((s) => ({ ...s, institution_name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Program</Label>
                  <Input
                    value={eduNew.program_name ?? ""}
                    onChange={(e) => setEduNew((s) => ({ ...s, program_name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Degree level</Label>
                  <Select
                    value={eduNew.degree_level ?? "default"}
                    onValueChange={(v) => setEduNew((s) => ({ ...s, degree_level: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select degree level" /></SelectTrigger>
                    <SelectContent>
                      {DEGREE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{titleizeEnumKey(opt)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={eduNew.status ?? "default"}
                    onValueChange={(v) => setEduNew((s) => ({ ...s, status: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{titleizeEnumKey(opt)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Started on</Label>
                  <Input
                    type="date"
                    value={eduNew.started_on ?? ""}
                    onChange={(e) => setEduNew((s) => ({ ...s, started_on: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Expected end</Label>
                  <Input
                    type="date"
                    value={eduNew.expected_end_on ?? ""}
                    onChange={(e) =>
                      setEduNew((s) => ({ ...s, expected_end_on: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Completed on</Label>
                  <Input
                    type="date"
                    value={eduNew.completed_on ?? ""}
                    onChange={(e) =>
                      setEduNew((s) => ({ ...s, completed_on: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>GPA</Label>
                  <Input
                    type="text"
                    value={(eduNew.gpa ?? "").toString()}
                    onChange={(e) => setEduNew((s) => ({ ...s, gpa: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Transcript URL</Label>
                  <Input
                    type="url"
                    value={eduNew.transcript_url ?? ""}
                    onChange={(e) => setEduNew((s) => ({ ...s, transcript_url: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={createEducation}>Create</Button>
              </div>
            </section>

            <Separator className="my-4" />

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Your education records</h3>
                <Badge variant="secondary">{education.length}</Badge>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : !hasEducation ? (
                <p className="text-sm text-muted-foreground">No education records yet.</p>
              ) : (
                education.map((r) => {
                  const id = r.id as number;
                  const d = eduDrafts[id] ?? r;
                  return (
                    <div key={id} className="rounded border border-border p-4 bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {d.program_name || "Program"} — {d.institution_name || "Institution"}
                        </div>
                        <Badge variant={d.status === "completed" ? "default" : "outline"}>
                          {d.status || "—"}
                        </Badge>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Institution</Label>
                          <Input
                            value={d.institution_name ?? ""}
                            onChange={(e) => setEduField(id, "institution_name", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Program</Label>
                          <Input
                            value={d.program_name ?? ""}
                            onChange={(e) => setEduField(id, "program_name", e.target.value)}
                          />
                        </div>

                        <div>
                          <Label>Degree level</Label>
                          <Select
                            value={d.degree_level ?? "default"}
                            onValueChange={(v) => setEduField(id, "degree_level", v)}
                          >
                            <SelectTrigger><SelectValue placeholder="Select degree level" /></SelectTrigger>
                            <SelectContent>
                              {DEGREE_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>{titleizeEnumKey(opt)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Status</Label>
                          <Select
                            value={d.status ?? "default"}
                            onValueChange={(v) => setEduField(id, "status", v)}
                          >
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>{titleizeEnumKey(opt)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Started on</Label>
                          <Input
                            type="date"
                            value={d.started_on ?? ""}
                            onChange={(e) => setEduField(id, "started_on", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Expected end</Label>
                          <Input
                            type="date"
                            value={d.expected_end_on ?? ""}
                            onChange={(e) => setEduField(id, "expected_end_on", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Completed on</Label>
                          <Input
                            type="date"
                            value={d.completed_on ?? ""}
                            onChange={(e) => setEduField(id, "completed_on", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>GPA</Label>
                          <Input
                            type="text"
                            value={(d.gpa ?? "").toString()}
                            onChange={(e) => setEduField(id, "gpa", e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label>Transcript URL</Label>
                          <Input
                            type="url"
                            value={d.transcript_url ?? ""}
                            onChange={(e) => setEduField(id, "transcript_url", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => saveEducation(id)}>Save</Button>
                        <Button variant="destructive" onClick={() => deleteEducation(id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          </TabsContent>

          {/* LANGUAGES TAB */}
          <TabsContent value="languages" className="space-y-6 pt-4">
            <section className="rounded border border-border p-4">
              <h3 className="font-medium mb-3">Add language</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Language</Label>
                  <Select
                    value={langNew.language ?? "default"}
                    onValueChange={(v) => setLangNew((s) => ({ ...s, language: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{titleizeEnumKey(opt)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Level</Label>
                  <Select
                    value={langNew.level ?? "default"}
                    onValueChange={(v) => setLangNew((s) => ({ ...s, level: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      {LEVEL_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{titleizeEnumKey(opt)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={createLanguage}>Create</Button>
              </div>
            </section>

            <Separator className="my-4" />

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Your language skills</h3>
                <Badge variant="secondary">{languages.length}</Badge>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : languages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No languages yet.</p>
              ) : (
                languages.map((l) => {
                  const id = l.id as number;
                  const d = langDrafts[id] ?? l;
                  return (
                    <div key={id} className="rounded border border-border p-4 bg-card space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Language</Label>
                          <Select
                            value={d.language ?? "default"}
                            onValueChange={(v) => setLangField(id, "language", v)}
                          >
                            <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                            <SelectContent>
                              {LANGUAGE_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>{titleizeEnumKey(opt)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Level</Label>
                          <Select
                            value={d.level ?? "default"}
                            onValueChange={(v) => setLangField(id, "level", v)}
                          >
                            <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                            <SelectContent>
                              {LEVEL_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>{titleizeEnumKey(opt)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => saveLanguage(id)}>Save</Button>
                        <Button variant="destructive" onClick={() => deleteLanguage(id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          </TabsContent>
        </Tabs>
      </AppCard>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
