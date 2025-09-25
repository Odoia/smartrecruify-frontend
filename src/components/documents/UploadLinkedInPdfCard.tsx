"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LinkedInPdfHelpDialog from "./LinkedInPdfHelpDialog";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { endpoints } from "@/lib/endpoints";
import { authHeader } from "@/lib/auth";
import { refreshAccessToken } from "@/lib/session";
import { toast } from "sonner";

async function postFormWithAuth<T = any>(url: string, form: FormData): Promise<T> {
  // 1st try
  let res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...authHeader(),
    },
    body: form,
    credentials: "include",
  });

  // Retry once on 401
  if (res.status === 401) {
    try {
      await refreshAccessToken();
      res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...authHeader(),
        },
        body: form,
        credentials: "include",
      });
    } catch {
      // fall through
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  return json as T;
}

export default function UploadLinkedInPdfCard() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function sendAndPersist() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const url = `${endpoints.documents}?dry_run=false&source=auto`; // persist immediately
      await postFormWithAuth(url, form);

      toast.success("Profile imported successfully");
      router.push("/profile/review"); // go to the review/edit screen
    } catch (e: any) {
      const msg = e?.message || "Upload failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Import your LinkedIn profile (PDF)</CardTitle>
          <CardDescription>
            Upload the PDF exported from your LinkedIn profile and we’ll save it automatically.
          </CardDescription>
        </div>
        <LinkedInPdfHelpDialog />
      </CardHeader>

      <CardContent className="space-y-3">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm file:mr-3 file:rounded file:border file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
      </CardContent>

      <CardFooter className="flex items-center gap-2">
        <Button disabled={!file || loading} onClick={sendAndPersist}>
          {loading ? "Uploading…" : "Upload and save"}
        </Button>
      </CardFooter>
    </Card>
  );
}
