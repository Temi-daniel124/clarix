/**
 * The Preview strip (BUILD-PLAN 0.4, D043).
 *
 * Preview deployments share the live demo data with Production, so anything done on a Preview
 * happens to the real demo. This says so at the top of every page: 32px, `amber-50` with
 * `amber-700` `small` text, pinned so it never scrolls away on a phone, and not dismissible.
 *
 * Sticky rather than fixed, so it takes its own space at the top of the page and pushes nothing
 * under itself. Everything else pinned to the top (desktop sidebars, the landing nav, the
 * elevated-access banner) sits below it through `--clarix-preview-offset`, which the root layout
 * sets on <body> only when this renders. On an installed iPhone app the strip also covers the
 * status-bar inset, so the 32px of text sits below the notch.
 */
export const PREVIEW_STRIP_OFFSET = "calc(32px + env(safe-area-inset-top, 0px))";

export function PreviewStrip() {
  return (
    <div
      role="note"
      className="sticky top-0 z-[60] shrink-0 bg-amber-50 pt-[env(safe-area-inset-top,0px)] text-amber-700"
    >
      <p className="flex h-8 items-center justify-center px-4 type-small whitespace-nowrap">
        Preview · uses the live demo data
      </p>
    </div>
  );
}
