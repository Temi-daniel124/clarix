import { Check, ShieldCheck } from "lucide-react";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

/**
 * "Your role at [Cooperative Name]" (officer blueprint 8.2).
 *
 * Read-only, and near the top of the officer's own Profile, because the blueprint makes it the
 * one thing this role's Profile has that no other role's does: "a clear, plain-language summary
 * of exactly what they're currently permitted to do".
 *
 * Anything not granted is simply absent, "never shown crossed out or greyed, matching the same
 * default-deny-and-don't-clutter principle used throughout this role's navigation". A list of
 * things you cannot do is an invitation to ask why, and the answer is never on this screen: it
 * is a decision their admin made, and the line below says so.
 *
 * Nothing here is editable. An officer who could change this panel would be an admin.
 */
export function OfficerRolePanel({
  cooperativeName,
  title,
  permissions,
}: {
  cooperativeName: string;
  /** What this cooperative calls them, Treasurer, Secretary, or nothing, which is common. */
  title: string | null;
  permissions: Record<PermissionKey, boolean>;
}) {
  const granted = PERMISSIONS.filter((permission) => permissions[permission.key]);

  return (
    <section className="mt-8 rounded-feature border border-border bg-surface p-5 md:p-6">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-card border border-border text-text-secondary"
        >
          <ShieldCheck className="size-[18px]" strokeWidth={1.75} />
        </span>

        <div className="min-w-0">
          <h2 className="type-card-title text-text">Your role at {cooperativeName}</h2>
          <p className="type-caption mt-1 text-text-muted">
            {title ?? "Cooperative officer"}
          </p>
        </div>
      </div>

      {granted.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-2">
          {granted.map((permission) => (
            <li key={permission.key} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-emerald"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--clarix-brand-accent) 14%, transparent)",
                }}
              >
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span className="type-secondary text-text">{permission.plain}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="type-secondary mt-5 max-w-[520px] text-text-secondary">
          Nothing has been switched on for you yet, so there is nothing here you can act on. Your
          admin can grant what you need, and it takes effect immediately.
        </p>
      )}

      <p className="type-caption mt-5 max-w-[520px] text-text-muted">
        {cooperativeName}&rsquo;s admin decides this, and can change it at any time. What is not
        listed is not something you can do here.
      </p>
    </section>
  );
}
