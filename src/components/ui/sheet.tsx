"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The one sheet (DESIGN_SYSTEM.md §5.4, D039, BUILD-PLAN 1.3).
 *
 * Phone: rises from the bottom, 24px top corners, a 36×4 grab handle 10px from the top, detents at
 * 50% and 92% of the viewport, drag down or tap the 40% black backdrop to close, the back button
 * closes it, content scrolls inside, the primary action is pinned in a footer above the safe area.
 *
 * Desktop (≥1024px): the same content as a 440px panel from the right, full height, `raised`, with a
 * lucide `X` and Esc. The page dims to 24%, except under a filter panel, which leaves it usable.
 *
 * It is Base UI's Drawer, which is Base UI Dialog (the same store, focus trap, Esc, Title and
 * Description) plus swipe-to-dismiss and snap points; the plan's "Base UI Dialog" with the drag
 * built in, so `vaul` is not needed. Motion is the CSS form of springStandard (`--ease-spring`,
 * `--duration-spring`); with reduced motion it opens and closes at once.
 */

const DESKTOP_QUERY = "(min-width: 1024px)";

/** §5.4: the sheet rests at half the viewport and expands to 92%. */
const PHONE_DETENTS = [0.5, 0.92];

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Phone first: the server and the first paint assume a phone, as the CSS does. */
function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

type SheetKind = "default" | "filter";

const SheetContext = createContext<{
  desktop: boolean;
  kind: SheetKind;
  closeThen: (next: () => void) => void;
} | null>(null);

function useSheet() {
  const context = useContext(SheetContext);
  if (!context) throw new Error("Sheet parts must sit inside <Sheet>.");
  return context;
}

type SheetProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * `filter` keeps the page usable beside the desktop panel (no dimming, no focus trap). On a phone
   * a filter sheet is an ordinary sheet: there is no room to use the page beside it.
   */
  kind?: SheetKind;
  children: ReactNode;
};

function Sheet({ open: openProp, defaultOpen = false, onOpenChange, kind = "default", children }: SheetProps) {
  const desktop = useIsDesktop();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  const id = useId();
  useBackButtonCloses(id, open, setOpen);
  const sidePanelFilter = desktop && kind === "filter";

  /**
   * Leaving from inside a sheet (a link, or an action that redirects): close it first and let its
   * history entry go, then move on. Navigating while the entry is still there would leave a stale
   * "sheet open" step behind the new page, so Back would appear to do nothing once.
   */
  const closeThen = useCallback(
    (next: () => void) => {
      if (window.history.state?.clarixSheet !== id) {
        setOpen(false);
        next();
        return;
      }
      window.addEventListener("popstate", () => next(), { once: true });
      setOpen(false);
    },
    [id, setOpen],
  );

  return (
    <SheetContext.Provider value={{ desktop, kind, closeThen }}>
      <Drawer.Root
        open={open}
        onOpenChange={(next) => setOpen(next)}
        swipeDirection={desktop ? "right" : "down"}
        snapPoints={desktop ? undefined : PHONE_DETENTS}
        modal={!sidePanelFilter}
        // A filter panel stays open while the list beside it is used; X and Esc close it.
        disablePointerDismissal={sidePanelFilter}
      >
        {children}
      </Drawer.Root>
    </SheetContext.Provider>
  );
}

/**
 * §5.4: "the Android/browser back button closes it (push a history entry on open)".
 *
 * Opening pushes one entry carrying this sheet's id, on top of whatever state the router keeps
 * there, so the URL and the page underneath do not change. Back pops it and closes the sheet.
 * Closing any other way removes the entry again, but only while it is still the current one: a
 * link followed from inside the sheet has already moved on, and going back then would undo it.
 * The push waits a tick so React's development double-run of effects does not push twice.
 */
function useBackButtonCloses(id: string, open: boolean, setOpen: (open: boolean) => void) {
  const setOpenRef = useRef(setOpen);
  useEffect(() => {
    setOpenRef.current = setOpen;
  });

  useEffect(() => {
    if (!open) return;

    let pushed = false;
    const timer = window.setTimeout(() => {
      window.history.pushState({ ...window.history.state, clarixSheet: id }, "");
      pushed = true;
    }, 0);

    function onPopState() {
      if (!pushed) return;
      pushed = false;
      setOpenRef.current(false);
    }
    window.addEventListener("popstate", onPopState);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("popstate", onPopState);
      if (pushed && window.history.state?.clarixSheet === id) window.history.back();
    };
  }, [open, id]);
}

const SheetTrigger = Drawer.Trigger;
const SheetClose = Drawer.Close;

/** Close the sheet, then run `next` (a navigation or an action that redirects). */
function useSheetNavigate() {
  return useSheet().closeThen;
}

/**
 * A link that leaves the sheet: it closes first, then navigates, so the sheet's history entry
 * never sits behind the new page. A modified click (new tab, new window) is left to the browser.
 */
function SheetLink({ href, onClick, ...props }: ComponentProps<typeof Link>) {
  const closeThen = useSheetNavigate();
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        closeThen(() => router.push(String(href)));
      }}
      {...props}
    />
  );
}

type SheetContentProps = {
  title: ReactNode;
  description?: ReactNode;
  /** The sheet's one primary action (and at most one other), pinned below the scrolling body. */
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
};

function SheetContent({ title, description, footer, className, children }: SheetContentProps) {
  const { desktop, kind } = useSheet();
  const dims = !(desktop && kind === "filter");

  return (
    <Drawer.Portal>
      {dims ? (
        <Drawer.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/40 lg:bg-black/24",
            // The backdrop lightens while the sheet is dragged away, and fades in and out with it.
            "data-[swiping]:opacity-[calc(1-var(--drawer-swipe-progress))]",
            "transition-opacity duration-[var(--duration-spring)] ease-[var(--ease-spring)]",
            "data-[swiping]:duration-0",
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
            "motion-reduce:transition-none",
          )}
        />
      ) : null}

      <Drawer.Viewport
        className={cn(
          // Below the Preview strip where there is one, so it never covers the sheet's title.
          "fixed inset-x-0 top-[var(--clarix-preview-offset,0px)] bottom-0 z-50",
          "flex items-end justify-center lg:items-stretch lg:justify-end",
          // A filter panel leaves the page usable: only the panel itself takes pointer events.
          !dims && "pointer-events-none",
        )}
      >
        <Drawer.Popup
          data-slot="sheet"
          className={cn(
            "pointer-events-auto relative flex flex-col bg-surface text-ink-900",
            "transition-transform duration-[var(--duration-spring)] ease-[var(--ease-spring)]",
            "data-[swiping]:duration-0 motion-reduce:transition-none",
            // Phone: full width, as tall as the upper detent; the lower detent is an offset down.
            "h-[92%] w-full rounded-t-sheet",
            // Base UI registers its variables as non-inheriting; the footer and body need the
            // detent offset too, so it is copied into one that inherits.
            "[--sheet-detent-offset:var(--drawer-snap-point-offset)] lg:[--sheet-detent-offset:0px]",
            // `transform`, not `translate`: while a drag is under way Base UI writes an inline
            // transform with the same value, which must replace this rather than add to it.
            "[transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))]",
            "data-[starting-style]:[transform:translateY(100%)] data-[ending-style]:[transform:translateY(100%)]",
            // Desktop: a 440px panel, full height, raised (§4.5: the shadow plus a hairline).
            "lg:h-full lg:w-[440px] lg:rounded-none lg:border-l lg:border-hairline lg:shadow-raised",
            "lg:[transform:translateX(var(--drawer-swipe-movement-x))]",
            "lg:data-[starting-style]:[transform:translateX(100%)] lg:data-[ending-style]:[transform:translateX(100%)]",
            className,
          )}
        >
          {desktop ? null : (
            <span
              aria-hidden
              data-slot="sheet-handle"
              className="absolute top-2.5 left-1/2 h-1 w-9 -translate-x-1/2 rounded-pill bg-ink-300"
            />
          )}

          <header className="flex shrink-0 items-start gap-3 px-5 pt-7 pb-4 lg:px-6 lg:pt-6">
            <div className="min-w-0 flex-1">
              <Drawer.Title className="type-title text-ink-900">{title}</Drawer.Title>
              {description ? (
                <Drawer.Description className="type-small mt-1 text-ink-500">
                  {description}
                </Drawer.Description>
              ) : null}
            </div>
            {/*
              Desktop shows the X (§5.4). A phone closes by dragging, the backdrop or back, none of
              which a screen reader reaches, so the same button is there for it, unseen.
            */}
            <Drawer.Close
              render={<Button variant="icon" aria-label="Close" />}
              className={cn("-mt-2 -mr-3 lg:-mr-2", desktop ? undefined : "sr-only focus-visible:not-sr-only")}
            >
              <X aria-hidden />
            </Drawer.Close>
          </header>

          <Drawer.Content
            data-slot="sheet-body"
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 lg:px-6",
              // At the lower detent the bottom of the sheet is below the screen: pad by that much so
              // the last line can still be scrolled into view.
              "pb-[calc(var(--sheet-detent-offset)+16px)] lg:pb-6",
              !footer && "pb-[calc(var(--sheet-detent-offset)+16px+env(safe-area-inset-bottom))]",
            )}
          >
            {children}
          </Drawer.Content>

          {footer ? (
            <footer
              data-slot="sheet-footer"
              className={cn(
                "flex shrink-0 gap-3 border-t border-hairline bg-surface px-5 pt-4 *:flex-1 lg:px-6",
                "pb-[calc(16px+env(safe-area-inset-bottom))] lg:pb-6",
                // Pinned to the visible bottom edge at either detent, moving with the sheet.
                "[transform:translateY(calc(-1*var(--sheet-detent-offset)))] lg:[transform:none]",
                "transition-transform duration-[var(--duration-spring)] ease-[var(--ease-spring)]",
                "motion-reduce:transition-none",
              )}
            >
              {footer}
            </footer>
          ) : null}
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetLink, useSheetNavigate };
