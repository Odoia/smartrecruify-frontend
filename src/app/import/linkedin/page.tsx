"use client";

import { useEffect, useState } from "react";
import { AppCard } from "@/components/ui/app-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { endpoints } from "@/lib/endpoints";
import { authHeader } from "@/lib/auth";

declare global {
  interface Window {
    smartrecruifyExt?: boolean;
  }
}

export default function ImportLinkedInPage() {
  const [url, setUrl] = useState("");
  const [extDetected, setExtDetected] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Descobrir se a extensão está instalada (content-script injeta um flag na página)
    const handler = (e: MessageEvent) => {
      if (e?.data === "SMARTRECRUIFY_EXT_READY") {
        setExtDetected(true);
      }
    };
    window.addEventListener("message", handler);
    // ping pro content script (se existir)
    window.postMessage("SMARTRECRUIFY_PING", "*");
    return () => window.removeEventListener("message", handler);
  }, []);

  async function fallbackImport() {
    toast.info("Extensão não encontrada. Usando fallback (bookmarklet).");
    // Abre instruções simples de 3 passos:
    alert(
      [
        "1) Abra seu perfil do LinkedIn em outra aba.",
        "2) Clique no seu favorito 'Expand All (LinkedIn)' para expandir tudo.",
        "3) Use o bookmarklet 'Save to Smartrecruify' para enviar os dados.",
        "",
        "Dica: Eu posso te fornecer esses dois favoritos prontos (bookmarklets)."
      ].join("\n")
    );
  }

  async function startImport() {
    if (!url || !/^https?:\/\/(www\.)?linkedin\.com\/in\//i.test(url)) {
      toast.error("Cole uma URL de perfil válida (linkedin.com/in/...)");
      return;
    }
    setBusy(true);
    try {
      if (!extDetected) {
        await fallbackImport();
        return;
      }

      // Pede para a extensão processar esta URL. Ela fará:
      // 1) abrir a aba
      // 2) expandir "see more"
      // 3) extrair dados
      // 4) enviar JSON para a API
      const msg = {
        type: "SMARTRECRUIFY_IMPORT_LINKEDIN",
        payload: {
          profileUrl: url,
          apiBase: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
          // endpoint que já combinamos no backend:
          endpointPath: "/education/import/linkedin",
          // opcional: headers de auth (bearer jwt) – melhor enviar do content script via cookie/httpOnly,
          // então aqui só mando um 'hint' e a extensão vai fazer chamada a partir do FRONT atual (com credenciais)
        },
      };

      // Envia a mensagem para a extensão (service worker)
      window.postMessage(msg, "*");
      toast.info("Import started… You may see a new tab with your LinkedIn profile.");

      // Escuta resultado
      const onDone = (e: MessageEvent) => {
        if (e?.data?.type === "SMARTRECRUIFY_IMPORT_DONE") {
          toast.success("LinkedIn imported successfully!");
          window.removeEventListener("message", onDone);
        }
        if (e?.data?.type === "SMARTRECRUIFY_IMPORT_ERROR") {
          toast.error(e.data?.message || "Import failed");
          window.removeEventListener("message", onDone);
        }
      };
      window.addEventListener("message", onDone);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Import from LinkedIn</h1>
      <p className="text-sm text-muted-foreground">
        Paste your public LinkedIn profile URL (e.g., https://www.linkedin.com/in/your-handle).
      </p>

      <AppCard className="p-5 mt-4 space-y-3">
        <div className="space-y-2">
          <label htmlFor="li" className="text-sm">LinkedIn URL</label>
          <Input
            id="li"
            placeholder="https://www.linkedin.com/in/dev-tiago-henrique/"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={startImport} disabled={busy}>
            {busy ? "Importing..." : "Import"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {extDetected ? "Extension detected ✅" : "Extension not detected ❌"}
          </span>
        </div>

        {!extDetected && (
          <p className="text-xs text-muted-foreground">
            Tip: Install our Chrome extension for one-click import. Without it, we’ll show a simple fallback (bookmarklet).
          </p>
        )}
      </AppCard>
    </div>
  );
}
