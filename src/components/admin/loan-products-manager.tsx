"use client";

import { useActionState, useState, useTransition } from "react";
import { ChevronDown, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SectionFeedback } from "@/components/clarix/section-feedback";
import { cn } from "@/lib/utils";
import {
  deleteLoanProductAction,
  saveLoanProductAction,
  type AdminState,
} from "@/app/admin/actions";

const INITIAL: AdminState = {};

export type LoanProduct = {
  id: string;
  name: string;
  minSavingsRatio: number;
  maxTenureMonths: number;
  interestTerms: string | null;
  isPublic: boolean;
};

/**
 * Loan Product & Policy Configuration (admin blueprint 2.3), and later 7.1.
 *
 * The rules set here are what every eligibility check in the product measures a loan against, so
 * the screen is deliberately plain: the two figures that matter are visible immediately, and the
 * things that only some cooperatives need, interest wording, whether the product is advertised,
 * sit behind an Advanced toggle rather than crowding the decision.
 *
 * The out-of-range warning never blocks a save. A cooperative's rules are its own; the warning
 * exists because a 3% savings ratio is far more often a typo for 30% than a deliberate policy,
 * and saying so once is cheaper than discovering it through a loan that should not have fitted.
 */
export function LoanProductsManager({
  products,
  peerRatioRange,
}: {
  products: LoanProduct[];
  /** What other cooperatives on the platform have configured, as fractions. */
  peerRatioRange: { min: number; max: number } | null;
}) {
  const [editing, setEditing] = useState<LoanProduct | "new" | null>(
    products.length === 0 ? "new" : null,
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="type-section text-text">Loan products</h2>

        {editing === null ? (
          <Button type="button" onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden strokeWidth={2.5} />
            Add loan product
          </Button>
        ) : null}
      </div>

      {products.length === 0 && editing !== "new" ? (
        <p className="type-body mt-4 text-text-secondary">
          No products yet. Until one exists, nobody can apply for a loan here.
        </p>
      ) : null}

      {products.length > 0 ? (
        <ul className="mt-6 divide-y divide-border rounded-feature border border-border bg-surface">
          {products.map((product) => (
            <li key={product.id}>
              <ProductRow
                product={product}
                onEdit={() => setEditing(product)}
                editing={editing !== null && editing !== "new" && editing.id === product.id}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {editing !== null ? (
        <div className="mt-6">
          <ProductForm
            key={editing === "new" ? "new" : editing.id}
            product={editing === "new" ? null : editing}
            peerRatioRange={peerRatioRange}
            onDone={() => setEditing(null)}
          />
        </div>
      ) : null}
    </div>
  );
}

function ProductRow({
  product,
  onEdit,
  editing,
}: {
  product: LoanProduct;
  onEdit: () => void;
  editing: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={cn("flex items-start gap-4 px-5 py-4", editing && "bg-background")}>
      <div className="min-w-0 flex-1">
        <p className="type-card-title text-text">{product.name}</p>
        <p className="type-secondary mt-1 text-text-secondary">
          {Math.round(product.minSavingsRatio * 100)}% of the amount must already be saved · up to{" "}
          {product.maxTenureMonths} months
        </p>
        {product.isPublic ? null : (
          <p className="type-caption mt-1 text-text-muted">Not advertised on Discovery.</p>
        )}
        {error ? (
          <p role="alert" className="type-caption mt-1 text-danger">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="icon" aria-label={`Edit ${product.name}`} onClick={onEdit}>
          <Pencil className="size-4" strokeWidth={2} />
        </Button>
        <Button
          variant="icon"
          aria-label={`Remove ${product.name}`}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteLoanProductAction(product.id);
              setError(result.error ?? null);
            })
          }
        >
          <Trash2 className="size-4 text-danger" strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
}

function ProductForm({
  product,
  peerRatioRange,
  onDone,
}: {
  product: LoanProduct | null;
  peerRatioRange: { min: number; max: number } | null;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveLoanProductAction, INITIAL);

  const [percentage, setPercentage] = useState(
    product ? String(Math.round(product.minSavingsRatio * 100)) : "35",
  );
  const [tenure, setTenure] = useState(product?.maxTenureMonths ?? 12);
  const [isPublic, setIsPublic] = useState(product?.isPublic ?? true);
  const [advanced, setAdvanced] = useState(false);

  const numeric = Number(percentage);
  const unusual =
    peerRatioRange !== null &&
    Number.isFinite(numeric) &&
    numeric > 0 &&
    (numeric / 100 < peerRatioRange.min * 0.5 || numeric / 100 > peerRatioRange.max * 1.5);

  return (
    <form action={formAction} className="rounded-feature border border-border bg-surface p-5 md:p-6">
      <h3 className="type-card-title text-text">
        {product ? `Edit ${product.name}` : "New loan product"}
      </h3>

      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="isPublic" value={isPublic ? "true" : "false"} />

      <div className="mt-5 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="product-name">Name</Label>
          <Input
            id="product-name"
            name="name"
            defaultValue={product?.name ?? ""}
            placeholder="e.g. Emergency loan"
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
          <FieldError message={state.fieldErrors?.name} />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="min-savings">Minimum savings</Label>
            <div className="relative">
              <Input
                id="min-savings"
                name="minSavingsPercentage"
                inputMode="numeric"
                value={percentage}
                onChange={(event) => setPercentage(event.target.value.replace(/[^0-9.]/g, ""))}
                className="pr-10 tabular"
                aria-invalid={Boolean(state.fieldErrors?.minSavingsPercentage)}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-4 flex items-center type-body text-text-muted"
              >
                %
              </span>
            </div>
            <p className="type-caption text-text-muted">
              {percentage || "0"}% of the amount requested must already be saved.
            </p>
            <FieldError message={state.fieldErrors?.minSavingsPercentage} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="max-tenure">Longest tenure</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="icon"
                aria-label="Fewer months"
                disabled={tenure <= 1}
                onClick={() => setTenure((value) => Math.max(1, value - 1))}
              >
                −
              </Button>
              <span className="type-card-title tabular w-14 text-center text-text" aria-live="polite">
                {tenure}
              </span>
              <Button
                type="button"
                variant="icon"
                aria-label="More months"
                disabled={tenure >= 120}
                onClick={() => setTenure((value) => Math.min(120, value + 1))}
              >
                +
              </Button>
              <span className="type-secondary text-text-secondary">months</span>
            </div>
            <input type="hidden" name="maxTenureMonths" value={tenure} />
            <FieldError message={state.fieldErrors?.maxTenureMonths} />
          </div>
        </div>

        {unusual ? (
          <p
            role="status"
            className="flex items-start gap-3 rounded-card border border-warning/30 px-4 py-3 type-secondary text-text"
            style={{ backgroundColor: "color-mix(in srgb, var(--clarix-warning) 10%, transparent)" }}
          >
            <TriangleAlert
              aria-hidden
              strokeWidth={2}
              className="mt-0.5 size-4 shrink-0 text-warning"
            />
            <span>
              {percentage}% sits well outside what other cooperatives here require (
              {Math.round(peerRatioRange!.min * 100)}–{Math.round(peerRatioRange!.max * 100)}%).
              That is allowed. Your rules are your own, but it is worth a second look in case a
              digit slipped.
            </span>
          </p>
        ) : null}

        <div>
          <Button
            type="button"
            variant="tertiary"
            onClick={() => setAdvanced((current) => !current)}
            aria-expanded={advanced}
            className="-ml-3"
          >
            <ChevronDown
              aria-hidden
              className={cn("transition-transform duration-200", advanced && "rotate-180")}
            />
            Advanced settings
          </Button>

          {advanced ? (
            <div className="mt-5 flex flex-col gap-5 border-l-2 border-border pl-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="interest-terms">Interest structure</Label>
                <Textarea
                  id="interest-terms"
                  name="interestTerms"
                  defaultValue={product?.interestTerms ?? ""}
                  placeholder="In your own words. Clarix records this and shows it to members, and never calculates from it."
                  className="min-h-24"
                />
                <p className="type-caption text-text-muted">
                  Kept as written. Clarix does not model interest in v1, so nothing here changes an
                  eligibility result.
                </p>
              </div>

              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="type-card-title text-text">Show on Discovery</p>
                  <p className="type-secondary mt-1 text-text-secondary">
                    Employees browsing cooperatives can see this product exists. Turn it off for a
                    product you run but do not advertise.
                  </p>
                </div>
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  aria-label="Show on Discovery"
                  className="mt-1 shrink-0"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : product ? "Save changes" : "Add product"}
        </Button>
        <Button type="button" variant="tertiary" onClick={onDone}>
          {state.saved ? "Done" : "Cancel"}
        </Button>
        <SectionFeedback saved={state.saved} error={state.error} />
      </div>
    </form>
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
