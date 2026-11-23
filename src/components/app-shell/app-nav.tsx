"use client";

import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Ellipsis, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/clarix/wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SIDEBAR_STORAGE_KEY } from "@/components/theme/theme-script";
import { springStandard } from "@/lib/motion";
import {
  DESTINATIONS,
  PRIMARY_DESTINATIONS,
  SECONDARY_DESTINATIONS,
  isActive,
  type Destination,
} from "./destinations";

/**
 * The persistent navigation, blueprint Part 3.
 *
 * Sidebar on desktop, floating tab pill on mobile, both generated from the same destination list
 * so the two can never drift into separate information architectures.
 *
 * Both are navy glass, matching the landing page's nav pill. That is deliberate: navigation
 * chrome is one fixed dark surface across the whole product while content follows the colour
 * scheme, which is what makes the app and the marketing page read as the same thing.
 * DESIGN_SYSTEM.md assigns brand-primary navy to "nav, headings, dark surfaces", so this is the
 * token doing its job.
 */

const RAIL_CHANGE_EVENT = "clarix:sidebar-change";

/* ---------------------------------------------------------------------------
   Desktop: a collapsible rail
--------------------------------------------------------------------------- */

export function AppSidebar() {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeToRail, readRail, () => false);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    const next = root.classList.contains("rail-collapsed") ? "expanded" : "collapsed";
    root.classList.toggle("rail-collapsed", next === "collapsed");

    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next);
    } catch {
      // Storage blocked; the rail still toggles, it just will not survive a reload.
    }

    window.dispatchEvent(new Event(RAIL_CHANGE_EVENT));
  }, []);

  return (
    <aside
      /* Width comes from the CSS variable so the collapsed state is correct on first paint. */
      /* Sticky and full-height: the blueprint calls this navigation persistent, and a rail that
         scrolls away on a long screen is not. */
      className="theme-dark sticky top-[var(--clarix-preview-offset,0px)] hidden h-[calc(100dvh-var(--clarix-preview-offset,0px))] shrink-0 flex-col border-r border-white/8 bg-navy-surface transition-[width] duration-[var(--duration-spring)] ease-[var(--ease-spring)] md:flex"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-5",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {collapsed ? null : (
          <Link href="/dashboard" aria-label="Clarix home" className="min-w-0 pl-1">
            <Wordmark tone="onDark" />
          </Link>
        )}

        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!collapsed}
          className="flex size-9 shrink-0 items-center justify-center rounded-card text-white/55 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
        >
          <PanelLeft
            aria-hidden
            strokeWidth={1.75}
            className={cn("size-[18px] transition-transform duration-200", collapsed && "rotate-180")}
          />
        </button>
      </div>

      <nav aria-label="Main" className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {DESTINATIONS.map((destination) => (
            <li key={destination.href}>
              <RailLink
                destination={destination}
                active={isActive(pathname, destination)}
                collapsed={collapsed}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div
        className={cn(
          "border-t border-white/8 px-4 py-4",
          collapsed ? "flex justify-center" : "flex items-center justify-between gap-3",
        )}
      >
        {collapsed ? null : <span className="type-caption text-white/40">Appearance</span>}
        <ThemeToggle tone="onDark" />
      </div>
    </aside>
  );
}

function RailLink({
  destination,
  active,
  collapsed,
}: {
  destination: Destination;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = destination.icon;

  return (
    <Link
      href={destination.href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? destination.label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-card py-2 type-body transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
        collapsed ? "justify-center px-2" : "px-2",
        active ? "bg-white/[0.07] font-medium text-white" : "text-white/60 hover:bg-white/[0.05] hover:text-white",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-card transition-colors duration-150",
          active ? "text-emerald" : "text-white/45",
        )}
        style={
          active
            ? { backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 16%, transparent)" }
            : undefined
        }
      >
        <Icon className="size-[18px]" strokeWidth={active ? 2.25 : 1.75} />
      </span>

      {collapsed ? (
        <span className="sr-only">{destination.label}</span>
      ) : (
        <span className="truncate">{destination.label}</span>
      )}
    </Link>
  );
}

/* ---------------------------------------------------------------------------
   Mobile: a floating glass pill
--------------------------------------------------------------------------- */

export function AppBottomTabs() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const moreActive =
    pathname === "/more" || SECONDARY_DESTINATIONS.some((entry) => pathname.startsWith(entry.href));

  return (
    <div
      /* Safe-area padding keeps the pill clear of the iOS home indicator, which
         DESIGN_SYSTEM.md § PWA app-shell behavior requires of every fixed element. */
      className="theme-dark fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <nav
        aria-label="Main"
        className="mx-auto flex w-fit max-w-full items-center gap-1 rounded-full border border-white/10 bg-navy-surface/88 p-2 shadow-[0_8px_30px_rgba(11,18,32,0.28)] backdrop-blur-xl"
      >
        {PRIMARY_DESTINATIONS.map((destination) => (
          <TabPill
            key={destination.href}
            href={destination.href}
            label={destination.label}
            icon={destination.icon}
            active={isActive(pathname, destination)}
            reduceMotion={Boolean(reduceMotion)}
          />
        ))}

        <TabPill
          href="/more"
          label="More"
          icon={Ellipsis}
          active={moreActive}
          reduceMotion={Boolean(reduceMotion)}
        />
      </nav>
    </div>
  );
}

/**
 * One tab. The active one widens to show its label beside the icon; the rest stay icon-only.
 *
 * The width change is a `layout` animation on the one standard spring: the same physics the
 * rest of the product uses, rather than a bespoke width tween. The label fades in behind it so
 * the text is not stretched while the pill is still growing.
 */
function TabPill({
  href,
  label,
  icon: Icon,
  active,
  reduceMotion,
}: {
  href: string;
  label: string;
  icon: Destination["icon"];
  active: boolean;
  reduceMotion: boolean;
}) {
  return (
    <motion.div layout={!reduceMotion} transition={reduceMotion ? { duration: 0 } : springStandard}>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        aria-label={label}
        className={cn(
          "flex h-11 items-center gap-2 rounded-full px-4 transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
          active ? "text-emerald" : "text-white/55 hover:text-white/80",
        )}
        style={
          active
            ? { backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 16%, transparent)" }
            : undefined
        }
      >
        <Icon
          aria-hidden
          className="size-[18px] shrink-0"
          strokeWidth={active ? 2.25 : 1.75}
        />

        <AnimatePresence initial={false}>
          {active ? (
            <motion.span
              key="label"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
              className="type-caption font-medium whitespace-nowrap"
            >
              {label}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </Link>
    </motion.div>
  );
}

/** Mobile-only top bar. Desktop puts the wordmark in the sidebar instead. */
export function AppTopBar() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-5 py-4 md:hidden">
      <Link href="/dashboard" aria-label="Clarix home">
        <Wordmark />
      </Link>
      <ThemeToggle />
    </header>
  );
}

/* ---------------------------------------------------------------------------
   Rail state
--------------------------------------------------------------------------- */

function subscribeToRail(onChange: () => void) {
  window.addEventListener(RAIL_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(RAIL_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Reads the class the inline script already set, so React and CSS agree from the start. */
function readRail(): boolean {
  return document.documentElement.classList.contains("rail-collapsed");
}
