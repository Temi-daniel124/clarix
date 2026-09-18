"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/clarix/wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { springStandard } from "@/lib/motion";
import {
  PLATFORM_ACCOUNT,
  PLATFORM_OVERSIGHT,
  PLATFORM_PRIMARY,
  isPlatformActive,
  isPlatformMoreActive,
  type PlatformDestination,
} from "./destinations";

/**
 * The Super Admin's navigation, super-admin blueprint Part 3.
 *
 * Same chrome as the other shells, because this is one product: navy glass, the one standard
 * spring, the same floating mobile pill. Two things differ, and both are the blueprint's own
 * instruction rather than a shortcut.
 *
 * It is flat. There is no collapsible "Manage" section and no rail-collapse control, because
 * there is nothing here deep enough to need either: eight rows, all visible, all one tap away.
 *
 * It is quiet. Where an admin's sidebar names the cooperative they manage under the wordmark,
 * this one says "Platform" and stops. This is the one part of Clarix meant to read as calm
 * infrastructure rather than a consumer app, and that starts with not decorating the frame.
 */

export function PlatformSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="theme-dark sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col overflow-y-auto border-r border-white/8 bg-navy-surface md:flex"
    >
      <div className="px-5 py-5">
        <Link href="/platform" aria-label="Clarix platform home" className="block min-w-0">
          <Wordmark tone="onDark" />
          <span className="mt-1 block type-caption text-white/45">Platform administration</span>
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {PLATFORM_PRIMARY.map((destination) => (
            <li key={destination.href}>
              <RailLink
                destination={destination}
                active={isPlatformActive(pathname, destination)}
              />
            </li>
          ))}
        </ul>

        <ul className="mt-6 flex flex-col gap-1 border-t border-white/8 pt-4">
          {PLATFORM_OVERSIGHT.map((destination) => (
            <li key={destination.href}>
              <RailLink destination={destination} active={pathname.startsWith(destination.href)} />
            </li>
          ))}
        </ul>

        <ul className="mt-6 flex flex-col gap-1 border-t border-white/8 pt-4">
          {PLATFORM_ACCOUNT.map((destination) => (
            <li key={destination.href}>
              <RailLink destination={destination} active={pathname.startsWith(destination.href)} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 px-4 py-4">
        <span className="type-caption text-white/40">Appearance</span>
        <ThemeToggle tone="onDark" />
      </div>
    </aside>
  );
}

function RailLink({
  destination,
  active,
}: {
  destination: PlatformDestination;
  active: boolean;
}) {
  const Icon = destination.icon;

  return (
    <Link
      href={destination.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-card px-2 py-2 type-body transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
        active
          ? "bg-white/[0.07] font-medium text-white"
          : "text-white/60 hover:bg-white/[0.05] hover:text-white",
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
      <span className="truncate">{destination.label}</span>
    </Link>
  );
}

export function PlatformBottomTabs() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <div className="theme-dark fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
      <nav
        aria-label="Main"
        className="mx-auto flex w-fit max-w-full items-center gap-1 rounded-full border border-white/10 bg-navy-surface/88 p-2 shadow-[0_8px_30px_rgba(11,18,32,0.28)] backdrop-blur-xl"
      >
        {PLATFORM_PRIMARY.map((destination) => (
          <TabPill
            key={destination.href}
            href={destination.href}
            label={destination.label}
            icon={destination.icon}
            active={isPlatformActive(pathname, destination)}
            reduceMotion={Boolean(reduceMotion)}
          />
        ))}

        <TabPill
          href="/platform/more"
          label="More"
          icon={Ellipsis}
          active={isPlatformMoreActive(pathname)}
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
  icon: PlatformDestination["icon"];
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

/** Mobile-only top bar. Says what this is and nothing more. */
export function PlatformTopBar() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-5 py-4 md:hidden">
      <Link href="/platform" className="min-w-0" aria-label="Platform home">
        <span className="block type-caption text-text-muted">Clarix</span>
        <span className="block truncate type-card-title text-text">Platform administration</span>
      </Link>
      <ThemeToggle />
    </header>
  );
}
