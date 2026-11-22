"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, FileText, Loader2, TriangleAlert, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { springStandard } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";

/**
 * Payslip Upload (blueprint 2.3).
 *
 * A large dashed drop zone as the dominant element, doubling as a tap target on mobile so it
 * opens the native file picker or camera. Once a file is chosen it collapses to a preview chip
 * with a Replace option, and the primary button becomes live.
 *
 * On the processing steps: the blueprint asks for a run-through-the-steps animation that is
 * "honest about the fact that something real is happening". Each step below therefore names
 * something that genuinely happens: the file is uploaded to a private bucket, then a document
 * row is written. There is no extraction step, because automatic extraction is P1 in
 * MVP-SCOPE.md and is not built; inventing a "Reading your payslip" stage for work nothing is
 * doing would be exactly the kind of theatre this product cannot afford. The review screen that
 * follows opens with the fields blank and editable, which is the degradation path blueprint 2.4
 * already specifies for a failed read.
 */

const ACCEPTED = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_BYTES = 10 * 1024 * 1024;

type Stage = { label: string; done: boolean };

export function PayslipUpload({
  userId,
  nextHref = "/onboarding/review",
  heading = "Upload your most recent payslip",
  intro = "Clarix reads one thing from it: what you earn. That is the figure your deduction limit is worked out from. It is stored privately and no cooperative can see it.",
}: {
  userId: string;
  /** Where the review step lives for this journey. Profile re-uploads (6.2) use their own. */
  nextHref?: string;
  heading?: string;
  intro?: string;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stages, setStages] = useState<Stage[] | null>(null);

  const accept = useCallback((candidate: File | undefined) => {
    if (!candidate) return;

    if (!ACCEPTED.includes(candidate.type)) {
      setError("That file type is not supported. Use a PDF, a photo, or a Word document.");
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setError("That file is larger than 10 MB. Try a photo taken at a lower resolution.");
      return;
    }

    setError(null);
    setFile(candidate);
  }, []);

  const process = useCallback(async () => {
    if (!file) return;

    setError(null);
    setStages([
      { label: "Uploading your payslip", done: false },
      { label: "Storing it privately", done: false },
    ]);

    try {
      const supabase = createClient();

      const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      // The first path segment must be the user's id: the storage policy keys on it, so this is
      // what stops one employee reaching another's payslip.
      const storagePath = `${userId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("payslips")
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      setStages([
        { label: "Uploading your payslip", done: true },
        { label: "Storing it privately", done: false },
      ]);

      const { error: insertError } = await supabase.from("documents").insert({
        user_id: userId,
        type: "payslip",
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type,
        byte_size: file.size,
        review_status: "pending_review",
      });

      if (insertError) throw new Error(insertError.message);

      setStages([
        { label: "Uploading your payslip", done: true },
        { label: "Storing it privately", done: true },
      ]);

      router.push(nextHref);
    } catch {
      setStages(null);
      setError("We could not upload that payslip. Check your connection and try again.");
    }
  }, [file, nextHref, router, userId]);

  const busy = stages !== null;

  return (
    <div className="pt-10">
      <h1 className="type-page-title text-text">{heading}</h1>
      <p className="type-body mt-3 text-text-secondary">{intro}</p>

      {error ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-card border border-danger/30 px-4 py-3 type-secondary text-danger"
          style={{ backgroundColor: "color-mix(in srgb, var(--clarix-danger) 8%, transparent)" }}
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden strokeWidth={2} />
          {error}
        </p>
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        {busy ? (
          <motion.ul
            key="stages"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex flex-col gap-3 rounded-card border border-border bg-surface p-5"
          >
            {stages.map((stage) => (
              <li key={stage.label} className="flex items-center gap-3 type-body text-text">
                <span
                  aria-hidden
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full",
                    stage.done ? "text-emerald-700" : "text-text-muted",
                  )}
                >
                  {stage.done ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : (
                    <Loader2 className="size-4 animate-spin" strokeWidth={2.5} />
                  )}
                </span>
                {stage.label}
              </li>
            ))}
          </motion.ul>
        ) : file ? (
          <motion.div
            key="chip"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : springStandard}
            className="mt-8 flex items-center gap-4 rounded-card border border-border bg-surface p-4"
          >
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-card"
              style={{
                backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)",
                color: "var(--clarix-brand-accent)",
              }}
            >
              <FileText className="size-5" strokeWidth={1.75} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="type-card-title truncate text-text">{file.name}</p>
              <p className="type-caption text-text-muted">{formatBytes(file.size)}</p>
            </div>

            <Button
              size="icon"
              variant="ghost"
              aria-label="Remove this file"
              onClick={() => setFile(null)}
            >
              <X className="size-4" strokeWidth={2} />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={false}
            className={cn(
              "mt-8 rounded-feature border-2 border-dashed p-10 text-center transition-colors duration-150 md:p-16",
              dragging ? "border-emerald bg-emerald/5" : "border-border bg-surface",
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              accept(event.dataTransfer.files?.[0]);
            }}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-4"
            >
              <span
                aria-hidden
                className="flex size-12 items-center justify-center rounded-card border border-border text-text-secondary"
              >
                <Upload className="size-5" strokeWidth={1.75} />
              </span>
              <span className="type-card-title mt-5 text-text">
                Tap to choose a file, or drag one here
              </span>
              <span className="type-caption mt-2 text-text-muted">
                PDF, JPG, PNG or Word, up to 10 MB
              </span>
            </button>

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="hidden"
              onChange={(event) => accept(event.target.files?.[0])}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Button onClick={process} disabled={!file || busy} className="mt-10 w-full">
        {busy ? "Working…" : "Process payslip"}
      </Button>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
