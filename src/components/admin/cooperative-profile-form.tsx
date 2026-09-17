"use client";

import { useActionState, useState } from "react";
import { Building2, Eye, EyeOff, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionFeedback } from "@/components/clarix/section-feedback";
import { saveCooperativeProfileAction, type AdminState } from "@/app/admin/actions";

const INITIAL: AdminState = {};

/**
 * Cooperative Profile Setup (admin blueprint 2.2), and the same screen later reached as Public
 * Profile Editor (7.3).
 *
 * This is the cooperative's front door: everything here is what an employee reads on the
 * Discovery Profile before deciding whether to apply. So the preview is not decoration. It is
 * the only way an admin can see the thing they are actually editing, and it renders from the
 * same values the form holds rather than from a saved copy, so it updates as they type.
 *
 * "Benefits and packages" is deliberately absent as a text field: the blueprint keeps it brief
 * here because the real mechanics are loan products, configured on their own screen. A summary
 * written by hand would be a second source of truth about what this cooperative lends.
 */
export function CooperativeProfileForm({
  cooperative,
  productSummary,
}: {
  cooperative: { id: string; name: string; description: string | null; requirements: string | null };
  /** One line per public loan product, for the preview's Benefits section. */
  productSummary: string[];
}) {
  const [state, formAction, pending] = useActionState(saveCooperativeProfileAction, INITIAL);

  const [name, setName] = useState(cooperative.name);
  const [description, setDescription] = useState(cooperative.description ?? "");
  const [requirements, setRequirements] = useState(cooperative.requirements ?? "");
  const [previewing, setPreviewing] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="type-section text-text">Public profile</h2>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreviewing((current) => !current)}
          aria-pressed={previewing}
        >
          {previewing ? (
            <EyeOff className="size-4" aria-hidden strokeWidth={2} />
          ) : (
            <Eye className="size-4" aria-hidden strokeWidth={2} />
          )}
          {previewing ? "Back to editing" : "Preview as an employee"}
        </Button>
      </div>

      {previewing ? (
        <DiscoveryPreview
          name={name}
          description={description}
          requirements={requirements}
          productSummary={productSummary}
        />
      ) : (
        <form action={formAction} className="mt-6 flex flex-col gap-8">
          <section className="flex flex-col gap-5">
            <h3 className="type-caption uppercase tracking-[0.08em] text-text-muted">
              Basic information
            </h3>

            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Cooperative name</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={Boolean(state.fieldErrors?.name)}
              />
              <FieldError message={state.fieldErrors?.name} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">What this cooperative is</Label>
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="A sentence or two an employee can read and know whether this is for them."
                aria-invalid={Boolean(state.fieldErrors?.description)}
              />
              <p className="type-caption text-text-muted">
                {description.trim().length}/600 characters.
              </p>
              <FieldError message={state.fieldErrors?.description} />
            </div>
          </section>

          <section className="flex flex-col gap-5 border-t border-border pt-8">
            <h3 className="type-caption uppercase tracking-[0.08em] text-text-muted">
              Requirements to join
            </h3>

            <div className="flex flex-col gap-2">
              <Label htmlFor="requirements">Who can join, in plain words</Label>
              <Textarea
                id="requirements"
                name="requirements"
                value={requirements}
                onChange={(event) => setRequirements(event.target.value)}
                placeholder="For example: open to confirmed staff with at least six months of service."
                aria-invalid={Boolean(state.fieldErrors?.requirements)}
              />
              <FieldError message={state.fieldErrors?.requirements} />
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={pending} size="sm">
              {pending ? "Saving…" : "Save profile"}
            </Button>
            <SectionFeedback saved={state.saved} error={state.error} />
          </div>
        </form>
      )}
    </div>
  );
}

/**
 * What an employee sees on Discovery (employee blueprint 4.4), drawn from the values in the form
 * rather than from the database, so it is a preview rather than a report.
 */
function DiscoveryPreview({
  name,
  description,
  requirements,
  productSummary,
}: {
  name: string;
  description: string;
  requirements: string;
  productSummary: string[];
}) {
  return (
    <div className="mt-6">
      <p className="type-caption text-text-muted">
        This is the Discovery profile an employee reads before applying.
      </p>

      <div className="mt-3 rounded-feature border border-border bg-surface p-6 md:p-8">
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-card text-emerald"
          style={{
            backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)",
          }}
        >
          <Building2 className="size-6" strokeWidth={1.75} />
        </span>

        <h3 className="type-page-title mt-5 text-text">{name || "Your cooperative"}</h3>

        <p className="type-body mt-3 max-w-[560px] text-text-secondary">
          {description.trim() || "No description yet: an employee would see nothing here."}
        </p>

        <div className="mt-8 border-t border-border pt-6">
          <h4 className="type-caption uppercase tracking-[0.08em] text-text-muted">
            Benefits and packages
          </h4>
          {productSummary.length === 0 ? (
            <p className="type-secondary mt-3 text-text-secondary">
              Nothing yet. Loan products you make public appear here.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {productSummary.map((line) => (
                <li key={line} className="flex items-start gap-2 type-secondary text-text">
                  <Users aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 text-text-muted" />
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <h4 className="type-caption uppercase tracking-[0.08em] text-text-muted">
            Requirements to join
          </h4>
          <p className="type-secondary mt-3 text-text-secondary">
            {requirements.trim() || "None stated: an employee would see nothing here."}
          </p>
        </div>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="type-caption text-danger">
      {message}
    </p>
  );
}
