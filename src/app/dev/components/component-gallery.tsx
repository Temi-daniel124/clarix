"use client";

import { useState, type ReactNode } from "react";
import { ArrowRight, Check, Copy, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, FilterChip } from "@/components/ui/chip";
import { Input, MoneyInput, PasswordInput, PhoneInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";

/**
 * The gallery behind /dev/components. Each row is one control; each cell one state. Hover, pressed
 * and focus are live: hover a button, hold it down, or Tab through the page.
 */
export function ComponentGallery() {
  const [money, setMoney] = useState("1,500,000");
  const [phone, setPhone] = useState("803 123 4567");
  const [sort, setSort] = useState<"name" | "recent">("name");
  const [tab, setTab] = useState<"overview" | "savings" | "loans">("overview");
  const [filters, setFilters] = useState<string[]>(["active"]);

  const toggle = (value: string) =>
    setFilters((current) => (current.includes(value) ? current.filter((v) => v !== value) : [...current, value]));

  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 py-10 md:px-8">
      <h1 className="type-title text-ink-900">Components</h1>
      <p className="type-body mt-2 text-ink-500">
        Every house control and state (DESIGN_SYSTEM.md §5). Not part of the product.
      </p>

      <Section title="Buttons" note="§5.1. Hover, hold and Tab for the live states.">
        {(["primary", "secondary", "tertiary", "destructive"] as const).map((variant) => (
          <Row key={variant} label={variant}>
            <Button variant={variant}>{capitalise(variant)}</Button>
            <Button variant={variant}>
              <Plus aria-hidden />
              With icon
            </Button>
            <Button variant={variant} loading>
              <Plus aria-hidden />
              Loading
            </Button>
            <Button variant={variant} disabled>
              Disabled
            </Button>
          </Row>
        ))}
        <Row label="icon">
          <Button variant="icon" aria-label="Copy">
            <Copy aria-hidden />
          </Button>
          <Button variant="icon" aria-label="Close">
            <X aria-hidden />
          </Button>
          <Button variant="icon" aria-label="Delete" disabled>
            <Trash2 aria-hidden />
          </Button>
        </Row>
        <Row label="full width (ends a flow)">
          <Button className="w-full sm:w-auto">
            Continue
            <ArrowRight aria-hidden />
          </Button>
        </Row>
        <div className="surface-navy mt-4 rounded-lg bg-navy-900 p-5">
          <p className="type-small text-on-navy-secondary">on-navy</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button variant="on-navy">Get started</Button>
            <Button variant="on-navy" loading>
              Loading
            </Button>
            <Button variant="on-navy" disabled>
              Disabled
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Inputs" note="§5.2. 52px on phones, 44px from 768px.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="g-text" label="Text">
            <Input id="g-text" placeholder="Adaeze Okafor" />
          </Field>
          <Field id="g-error" label="With an error" error="Enter a name.">
            <Input id="g-error" aria-invalid defaultValue="" aria-describedby="g-error-error" />
          </Field>
          <Field id="g-money" label="Money">
            <MoneyInput id="g-money" value={money} onValueChange={setMoney} />
          </Field>
          <Field id="g-phone" label="Phone">
            <PhoneInput id="g-phone" value={phone} onValueChange={setPhone} />
          </Field>
          <Field id="g-password" label="Password">
            <PasswordInput id="g-password" defaultValue="correct horse" />
          </Field>
          <Field id="g-disabled" label="Disabled">
            <Input id="g-disabled" disabled defaultValue="Read only" />
          </Field>
          <Field id="g-note" label="Note (optional)">
            <Textarea id="g-note" placeholder="Where these figures came from" className="min-h-24" />
          </Field>
        </div>
      </Section>

      <Section title="Chips" note="§5.6. Status chips say something; filter chips toggle.">
        <Row label="status">
          <Chip>Not on Clarix yet</Chip>
          <Chip tone="positive" icon={<Check aria-hidden />}>
            Eligible
          </Chip>
          <Chip tone="attention">Awaiting a decision</Chip>
          <Chip tone="stop" icon={<TriangleAlert aria-hidden />}>
            Above limit by ₦16,750
          </Chip>
        </Row>
        <Row label="filter">
          {["active", "pending", "suspended"].map((value) => (
            <FilterChip key={value} selected={filters.includes(value)} onClick={() => toggle(value)}>
              {capitalise(value)}
            </FilterChip>
          ))}
          <FilterChip selected={false} disabled>
            Disabled
          </FilterChip>
        </Row>
      </Section>

      <Section title="Segmented control" note="§5.6 Continuous Tabs. Arrow keys move and select.">
        <Row label="choice">
          <SegmentedControl
            label="Sort members"
            segments={[
              { value: "name", label: "By name" },
              { value: "recent", label: "Recently joined" },
            ]}
            value={sort}
            onChange={setSort}
          />
        </Row>
        <Row label="tabs">
          <SegmentedControl
            role="tabs"
            label="Member record"
            segments={[
              { value: "overview", label: "Overview" },
              { value: "savings", label: "Savings" },
              { value: "loans", label: "Loans" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </Row>
      </Section>
    </main>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="mt-12 border-t border-hairline pt-8">
      <h2 className="type-heading text-ink-900">{title}</h2>
      <p className="type-small mt-1 text-ink-500">{note}</p>
      <div className="mt-6 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
      <p className="type-small w-40 shrink-0 text-ink-500">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="type-small text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function capitalise(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
