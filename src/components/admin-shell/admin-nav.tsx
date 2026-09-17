"use client";

import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Ellipsis, PanelLeft, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/clarix/wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SIDEBAR_STORAGE_KEY } from "@/components/theme/theme-script";
import { springStandard } from "@/lib/motion";
import { isAdminActive, isMoreActive, staffNav, type AdminDestination } from "./destinations";

/**
 * Which navigation this person gets. Plain data rather than the destination lists themselves:
 * every destination carries an icon *component*, which cannot cross the server/client boundary,
 * so the shell hands over a role and one flag and the client builds the lists from them.
 */
export type StaffNavProps = {
  role: "admin" | "officer";
  canImport: boolean;
  canViewMembers: boolean;
};

/**
 * The cooperative admin's navigation, admin blueprint Part 3.
 *
 * Same chrome as the employee shell, because the two are one product: navy glass, the one
 * standard spring, the same collapsible-rail behaviour and the same floating mobile pill. What
 * differs is what it points at, and one structural thing the employee side does not need, a
 * "Manage cooperative" section that expands into its own sub-items on desktop.
 *
 * The cooperative's name sits under the wordmark rather than in the page, because an admin who
 * holds a role at more than one cooperative needs to see which one they are looking at without
 * reading the content to work it out.
 */

const RAIL_CHANGE_EVENT = "clarix:sidebar-change";

export function AdminSidebar({
  cooperativeName,
  role,
  canImport,
  canViewMembers,
}: StaffNavProps & { cooperativeName: string }) {
  const pathname = usePathname();
  const nav = staffNav(role, {
    can_import_members: canImport,
    can_view_members: canViewMembers,
  });
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
      className="theme-dark sticky top-0 hidden h-dvh shrink-0 flex-col overflow-y-auto border-r border-white/8 bg-navy-surface transition-[width] duration-[var(--duration-spring)] ease-[var(--ease-spring)] md:flex"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-5",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {collapsed ? null : (
          <Link href="/admin" aria-label="Clarix home" className="min-w-0 pl-1">
            <Wordmark tone="onDark" />
            <span className="mt-1 block truncate type-caption text-white/45">
              {cooperativeName}
            </span>
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
          {nav.primary.map((destination) => (
            <li key={destination.href}>
              <RailLink
                destination={destination}
                active={isAdminActive(pathname, destination)}
                collapsed={collapsed}
              />
            </li>
          ))}
        </ul>

        {nav.manage.length > 0 ? (
          <>
            <p
              className={cn(
                "mt-6 mb-1 px-3 type-caption uppercase tracking-[0.08em] text-white/35",
                collapsed && "sr-only",
              )}
            >
              Manage cooperative
            </p>

            <ul className="flex flex-col gap-1">
              {nav.manage.map((destination) => (
                <li key={destination.href}>
                  <RailLink
                    destination={destination}
                    active={pathname.startsWith(destination.href)}
                    collapsed={collapsed}
                    muted
                  />
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <ul className="mt-6 flex flex-col gap-1 border-t border-white/8 pt-4">
          {nav.account.map((destination) => (
            <li key={destination.href}>
              <RailLink
                destination={destination}
                active={pathname.startsWith(destination.href)}
                collapsed={collapsed}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div
        className={cn(
          "mt-4 border-t border-white/8 px-4 py-4",
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
  muted = false,
}: {
  destination: AdminDestination;
  active: boolean;
  collapsed: boolean;
  /** Sub-items sit one level down, so they read quieter than the four main areas. */
  muted?: boolean;
}) {
  const Icon = destination.icon;

  return (
    <Link
      href={destination.href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? destination.label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-card px-2 py-2 transition-colors duration-150",
        muted ? "type-secondary" : "type-body",
        "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
        collapsed && "justify-center",
        active
          ? "bg-white/[0.07] font-medium text-white"
          : "text-white/60 hover:bg-white/[0.05] hover:text-white",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-center rounded-card transition-colors duration-150",
          muted ? "size-7" : "size-8",
          active ? "text-emerald" : "text-white/45",
        )}
        style={
          active
            ? { backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 16%, transparent)" }
            : undefined
        }
      >
        <Icon className={muted ? "size-4" : "size-[18px]"} strokeWidth={active ? 2.25 : 1.75} />
      </span>

      {collapsed ? (
        <span className="sr-only">{destination.label}</span>
      ) : (
        <span className="truncate">{destination.label}</span>
      )}
    </Link>
  );
}

export function AdminBottomTabs({ role, canImport, canViewMembers }: StaffNavProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const nav = staffNav(role, {
    can_import_members: canImport,
    can_view_members: canViewMembers,
  });

  return (
    <div className="theme-dark fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
      <nav
        aria-label="Main"
        className="mx-auto flex w-fit max-w-full items-center gap-1 rounded-full border border-white/10 bg-navy-surface/88 p-1.5 shadow-[0_8px_30px_rgba(11,18,32,0.28)] backdrop-blur-xl"
      >
        {nav.primary.map((destination) => (
          <TabPill
            key={destination.href}
            href={destination.href}
            label={destination.label}
            icon={destination.icon}
            active={isAdminActive(pathname, destination)}
            reduceMotion={Boolean(reduceMotion)}
          />
        ))}

        <TabPill
          href="/admin/more"
          label="More"
          icon={Ellipsis}
          active={isMoreActive(pathname, nav)}
          reduceMotion={Boolean(reduceMotion)}
        />
      </nav>
    </div>
  );
}

function TabPill({
  href,
  label,
  icon: Icon,
  active,
  reduceMotion,
}: {
  href: string;
  label: string;
  icon: AdminDestination["icon"];
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
          "flex h-11 items-center gap-2 rounded-full px-3.5 transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
          active ? "text-emerald" : "text-white/55 hover:text-white/80",
        )}
        style={
          active
            ? { backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 16%, transparent)" }
            : undefined
        }
      >
        <Icon aria-hidden className="size-[18px] shrink-0" strokeWidth={active ? 2.25 : 1.75} />

        <AnimatePresence initial={false}>
          {active ? (
            <motion.span
              key="label"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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

/** Mobile-only top bar: the cooperative's name is what staff need to see, not the wordmark. */
export function AdminTopBar({
  cooperativeName,
  role,
}: {
  cooperativeName: string;
  role: "admin" | "officer";
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-5 py-4 md:hidden">
      <Link href="/admin" className="min-w-0" aria-label="Cooperative home">
        <span className="block type-caption text-text-muted">
          {role === "admin" ? "Managing" : "Working at"}
        </span>
        <span className="block truncate type-card-title text-text">{cooperativeName}</span>
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href="/admin/profile"
          aria-label="Profile"
          className="flex size-10 items-center justify-center rounded-card text-text-muted transition-colors duration-150 hover:bg-background hover:text-text focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
        >
          <Settings2 aria-hidden strokeWidth={1.75} className="size-[18px]" />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

function subscribeToRail(onChange: () => void) {
  window.addEventListener(RAIL_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(RAIL_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readRail(): boolean {
  return document.documentElement.classList.contains("rail-collapsed");
}
