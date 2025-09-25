"use client";
import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function LinkedInPdfHelpDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          title="How to download your LinkedIn PDF"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>How to download your LinkedIn profile as PDF</DialogTitle>
        </DialogHeader>
        <ol className="list-decimal pl-5 space-y-2 text-sm leading-6">
          <li>Go to your LinkedIn profile (public profile page).</li>
          <li>Click on the <b>More</b> (…) button.</li>
          <li>Select <b>Save to PDF</b> (sometimes shown as “Download as PDF”).</li>
          <li>Wait for the PDF file to be generated and then upload it here.</li>
        </ol>
        <p className="text-xs text-muted-foreground mt-2">
          Tip: if you don’t see “Save to PDF”, choose “Print” and then select
          “Save as PDF” as destination.
        </p>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setOpen(false)}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
