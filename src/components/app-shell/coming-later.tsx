import type { LucideIcon } from "lucide-react";

/**
 * A destination the navigation reaches but whose screen belongs to a later part of the
 * blueprint.
 *
 * It exists so the shell has no dead tabs. It says plainly what will be here and does not
 * imitate the screen it is standing in for — a fake dashboard of zeroes would be worse than an
 * honest sentence, and DESIGN_SYSTEM.md asks empty states to explain what happens next rather
 * than say "no data".
 */
export function ComingLater({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-16 text-center md:px-8 md:py-24">
      <span
        aria-hidden
        className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <h1 className="type-page-title mt-6 text-text">{title}</h1>
      <p className="type-body mt-3 text-text-secondary">{body}</p>
    </div>
  );
}
