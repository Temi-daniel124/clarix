"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { Separator } from "@base-ui/react/separator";
import {
  ArrowLeftRight,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleQuestionMark,
  LoaderCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetLink, useSheetNavigate } from "@/components/ui/sheet";
import { Wordmark } from "@/components/clarix/wordmark";
import { SIDEBAR_STORAGE_KEY } from "@/components/app-shell/rail-script";
import { signOutAction, switchCooperativeAction } from "@/app/shell-actions";
import { cn } from "@/lib/utils";
import { CommandPalette, type PaletteCommand } from "./command-palette";
import { otherViewFor } from "./other-view";
import { isMoreActive, isNavActive, shellNav, type NavItem, type ShellNav } from "./nav";
import type { ShellCooperative, ShellIdentity, ShellKind, ShellPermissions } from "./types";

/**
 * The app shell, one for all four roles (DESIGN_SYSTEM §5.5, BUILD-PLAN 1.4).
 *
 * Phone and tablet (<1024px): a 56px top bar (avatar, "Hi, Name", the cooperative for staff, the
 * bell) and a floating navy pill tab bar of equal slots, with a raised centre "+" for cooperative
 * staff (D051). Every screen keeps the bar clear at the bottom so it never covers content.
 *
 * Desktop (≥1024px, the same line the Sheet switches at): a 248px light sidebar that collapses to
 * 72px, with the cooperative switcher, a Search field that opens the `Ctrl/⌘ K` palette, the
 * role's grouped links, and the account menu at the bottom.
 *
 * What a role sees comes from `shellNav` and the server's permission flags. Leaving a destination
 * out of a menu is never the boundary; every screen and the database check again.
 */

type AppShellProps = {
  kind: ShellKind;
  permissions?: ShellPermissions;
  identity: ShellIdentity;
  children: ReactNode;
};

const NO_PERMISSIONS: ShellPermissions = { canImport: false, canViewMembers: false };

export function AppShell({ kind, permissions = NO_PERMISSIONS, identity, children }: AppShellProps) {
  const nav = useMemo(() => shellNav(kind, permissions), [kind, permissions]);
  const staff = kind === "admin" || kind === "officer";
  const current = identity.cooperatives.find((cooperative) => cooperative.current) ?? null;
  const canSwitch = staff && identity.cooperatives.length > 1;
  const otherView = otherViewFor(kind === "member" ? "member" : kind === "platform" ? "platform" : "staff", identity);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const commands = useMemo<PaletteCommand[]>(() => {
    const go = nav.groups.flatMap((group) => group.items);
    const list: PaletteCommand[] = [
      ...go.map((item) => ({ id: item.href, label: item.label, group: "Go to", icon: item.icon, href: item.href })),
      { id: nav.profile, label: "Profile", group: "Go to", icon: Settings2, href: nav.profile },
      { id: nav.help, label: "Help", group: "Go to", icon: CircleQuestionMark, href: nav.help },
    ];
    if (canSwitch) {
      for (const cooperative of identity.cooperatives.filter((entry) => !entry.current)) {
        list.push({
          id: `switch-${cooperative.id}`,
          label: `Switch to ${cooperative.name}`,
          group: "Switch",
          icon: ArrowLeftRight,
          run: () => startTransition(() => switchCooperativeAction(cooperative.id).then(() => undefined)),
        });
      }
    }
    if (otherView) {
      list.push({ id: otherView.href, label: otherView.label, group: "Switch", icon: ArrowLeftRight, href: otherView.href });
    }
    return list;
  }, [nav, canSwitch, identity.cooperatives, otherView]);

  return (
    <div className="flex min-h-app flex-1">
      <Sidebar
        nav={nav}
        kind={kind}
        identity={identity}
        current={current}
        canSwitch={canSwitch}
        otherView={otherView}
        onSearch={() => setPaletteOpen(true)}
        onSwitch={() => setSwitcherOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          nav={nav}
          staff={staff}
          identity={identity}
          current={current}
          canSwitch={canSwitch}
          onSwitch={() => setSwitcherOpen(true)}
        />

        {/*
          §5.5: every phone screen keeps the floating bar clear, plus the safe area. 112px for the
          bar alone; 120px where the quick action rises 20px above it (D051).
        */}
        <main
          className={cn(
            "flex-1 lg:pb-12",
            staff && nav.quickActions.length > 0
              ? "pb-[calc(120px+env(safe-area-inset-bottom))]"
              : "pb-[calc(112px+env(safe-area-inset-bottom))]",
          )}
        >
          {children}
        </main>
      </div>

      <TabBar nav={nav} onQuickActions={staff && nav.quickActions.length > 0 ? () => setQuickOpen(true) : null} />

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={commands} />

      {canSwitch ? (
        <Sheet open={switcherOpen} onOpenChange={setSwitcherOpen}>
          <SheetContent title="Switch cooperative" description="Choose where you are working.">
            <SwitcherList cooperatives={identity.cooperatives} otherView={otherView} />
          </SheetContent>
        </Sheet>
      ) : null}

      {staff && nav.quickActions.length > 0 ? (
        <Sheet open={quickOpen} onOpenChange={setQuickOpen}>
          <SheetContent title="Quick actions">
            <ul className="flex flex-col">
              {nav.quickActions.map((action) => (
                <li key={action.href} className="border-b border-hairline last:border-b-0">
                  <SheetRow item={action} />
                </li>
              ))}
            </ul>
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Phone: top bar
--------------------------------------------------------------------------- */

function TopBar({
  nav,
  staff,
  identity,
  current,
  canSwitch,
  onSwitch,
}: {
  nav: ShellNav;
  staff: boolean;
  identity: ShellIdentity;
  current: ShellCooperative | null;
  canSwitch: boolean;
  onSwitch: () => void;
}) {
  const greeting = (
    <>
      <Avatar initials={identity.initials} />
      <span className="flex min-w-0 flex-col">
        <span className="type-heading truncate text-ink-900">Hi, {identity.firstName}</span>
        {staff && current ? (
          <span className="type-small flex min-w-0 items-center gap-1 text-ink-500">
            <span className="truncate">{current.name}</span>
            {canSwitch ? <ChevronDown aria-hidden className="size-4 shrink-0" strokeWidth={1.75} /> : null}
          </span>
        ) : null}
      </span>
    </>
  );

  return (
    <header className="sticky top-[var(--clarix-preview-offset,0px)] z-30 flex h-14 shrink-0 items-center gap-3 border-b border-hairline bg-canvas pr-3 pl-5 md:pl-6 lg:hidden">
      {canSwitch ? (
        <button
          type="button"
          onClick={onSwitch}
          aria-label={`Hi, ${identity.firstName}. Working in ${current?.name ?? "your cooperative"}. Switch cooperative`}
          className="-ml-2 flex h-12 min-w-0 flex-1 items-center gap-3 rounded-md pr-2 pl-2 text-left transition-colors duration-[var(--duration-quick)] ease-[var(--ease-quick)] active:bg-surface-sunken"
        >
          {greeting}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{greeting}</div>
      )}

      <Button
        variant="icon"
        render={<Link href={nav.notifications} />}
        aria-label={identity.hasUnread ? "Notifications, unread" : "Notifications"}
        className="relative shrink-0"
      >
        <Bell aria-hidden />
        {identity.hasUnread ? (
          <span aria-hidden className="absolute top-2.5 right-2.5 size-2 rounded-pill bg-red-500 ring-2 ring-canvas" />
        ) : null}
      </Button>
    </header>
  );
}

function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "type-small flex size-8 shrink-0 items-center justify-center rounded-pill bg-emerald-100 font-semibold text-emerald-700",
        className,
      )}
    >
      {initials}
    </span>
  );
}

/** A cooperative's mark until logos exist (D046: logos or initials, never a grey letter tile). */
function CooperativeMark({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className="type-small flex size-8 shrink-0 items-center justify-center rounded-sm bg-emerald-100 font-semibold text-emerald-700"
    >
      {initials || "C"}
    </span>
  );
}

/* ---------------------------------------------------------------------------
   Phone: floating pill tab bar
--------------------------------------------------------------------------- */

function TabBar({ nav, onQuickActions }: { nav: ShellNav; onQuickActions: (() => void) | null }) {
  const pathname = usePathname();
  const moreActive = isMoreActive(pathname, nav);

  const slot = (key: string, node: ReactNode) => (
    <li key={key} className="flex min-w-0 flex-1 justify-center">
      {node}
    </li>
  );
  const tabs = nav.tabs.map((tab) =>
    slot(tab.href, <Tab item={tab} active={isNavActive(pathname, tab, nav.home)} />),
  );
  const more = slot("more", <Tab item={nav.more} active={moreActive} />);

  // Staff: the centre slot is left empty for the raised action, with the tabs either side of it.
  const half = Math.ceil(nav.tabs.length / 2);
  const slots = onQuickActions
    ? [...tabs.slice(0, half), slot("quick", <span aria-hidden className="size-12" />), ...tabs.slice(half), more]
    : [...tabs, more];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(16px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:hidden">
      <nav
        aria-label="Main"
        className="pointer-events-auto relative h-16 w-full max-w-[360px] rounded-pill border border-hairline-on-navy bg-navy-900 p-2 shadow-raised"
      >
        <ul className="flex h-12 items-center">{slots}</ul>

        {onQuickActions ? (
          // D051: the primary action grows out of the bar. A 56px emerald circle wearing a 4px border
          // in the bar's own navy, so circle and bar read as one shape; it rises 20px above the bar's
          // top edge (21px from the padding box, which starts inside the bar's 1px border) and the
          // rest overlaps the bar. Its only shadow is its own emerald one.
          <button
            type="button"
            onClick={onQuickActions}
            aria-label="Quick actions"
            className="absolute top-[-21px] left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-pill border-4 border-navy-900 bg-emerald-500 text-white shadow-quick-action transition-[background-color,scale] duration-[var(--duration-spring)] ease-[var(--ease-spring)] hover:bg-emerald-600 active:scale-[0.96] active:bg-emerald-700 motion-reduce:transition-none"
          >
            <Plus aria-hidden className="size-6" strokeWidth={1.75} />
          </button>
        ) : null}
      </nav>
    </div>
  );
}

/** One equal slot: a 24px icon over its 12px label, 2px apart, centred. The whole slot is the target. */
function Tab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-12 w-full min-w-11 flex-col items-center justify-center gap-0.5 rounded-pill",
        "transition-colors duration-[var(--duration-quick)] ease-[var(--ease-quick)] motion-reduce:transition-none",
        active ? "text-on-navy" : "text-on-navy-secondary",
      )}
    >
      <Icon aria-hidden className="size-6 shrink-0" strokeWidth={1.75} />
      <span className="type-tab-label max-w-full truncate">{item.label}</span>
    </Link>
  );
}

/* ---------------------------------------------------------------------------
   Sheets: switcher and quick actions
--------------------------------------------------------------------------- */

function SheetRow({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <SheetLink href={item.href} className="flex h-[52px] items-center gap-4 rounded-sm">
      <Icon aria-hidden className="size-5 shrink-0 text-ink-500" strokeWidth={1.75} />
      <span className="type-body flex-1 truncate text-ink-900">{item.label}</span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-500" strokeWidth={1.75} />
    </SheetLink>
  );
}

function SwitcherList({
  cooperatives,
  otherView,
}: {
  cooperatives: ShellCooperative[];
  otherView: { href: string; label: string } | null;
}) {
  const closeThen = useSheetNavigate();
  const [pending, startTransition] = useTransition();
  const [choosing, setChoosing] = useState<string | null>(null);

  return (
    <>
      <ul className="flex flex-col">
        {cooperatives.map((cooperative) => (
          <li key={cooperative.id} className="border-b border-hairline last:border-b-0">
            <button
              type="button"
              disabled={pending}
              aria-current={cooperative.current ? "true" : undefined}
              onClick={() => {
                if (cooperative.current) return closeThen(() => undefined);
                setChoosing(cooperative.id);
                closeThen(() => startTransition(() => switchCooperativeAction(cooperative.id).then(() => undefined)));
              }}
              className="flex h-16 w-full items-center gap-4 rounded-sm text-left disabled:opacity-40"
            >
              <CooperativeMark name={cooperative.name} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-body truncate text-ink-900">{cooperative.name}</span>
                <span className="type-small text-ink-500">{cooperative.roleLabel}</span>
              </span>
              {choosing === cooperative.id && pending ? (
                <LoaderCircle aria-hidden className="size-5 shrink-0 animate-spin text-ink-500" />
              ) : cooperative.current ? (
                <Check aria-label="Current" className="size-5 shrink-0 text-emerald-700" strokeWidth={1.75} />
              ) : null}
            </button>
          </li>
        ))}
      </ul>
      {otherView ? (
        <div className="mt-6 border-t border-hairline pt-2">
          <SheetRow item={{ href: otherView.href, label: otherView.label, icon: ArrowLeftRight }} />
        </div>
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------------------
   Desktop: sidebar
--------------------------------------------------------------------------- */

const RAIL_CHANGE_EVENT = "clarix:sidebar-change";

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

function subscribeNever() {
  return () => {};
}

/** "⌘K" on Apple keyboards, "Ctrl K" everywhere else. */
function useShortcutLabel() {
  return useSyncExternalStore(
    subscribeNever,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"),
    () => "Ctrl K",
  );
}

/**
 * Whether the sidebar's content fits the window below the Preview strip. Starts false, so the first
 * paint is the version that is always right (part of the page, no inner scrollbar), then pins the
 * sidebar once it is known to fit, and re-checks as the window or the sidebar changes size.
 */
function useFitsWindow(ref: React.RefObject<HTMLElement | null>): boolean {
  const [fits, setFits] = useState(false);
  useLayoutEffect(() => {
    const aside = ref.current;
    if (!aside) return;
    function measure() {
      const element = ref.current;
      if (!element) return;
      // The content's own height: every child at its natural size, whatever the aside is set to.
      const natural = [...element.children].reduce((sum, child) => {
        const box = child as HTMLElement;
        const style = getComputedStyle(box);
        const inner = box.tagName === "NAV" ? [...box.children].reduce((h, c) => h + (c as HTMLElement).offsetHeight, 0) + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) : box.offsetHeight;
        return sum + inner + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
      }, 0);
      const offset = parseFloat(getComputedStyle(document.body).getPropertyValue("--clarix-preview-offset")) || 0;
      setFits(natural <= window.innerHeight - offset);
    }
    measure();
    const observer = new ResizeObserver(measure);
    for (const child of aside.children) observer.observe(child);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ref]);
  return fits;
}

function Sidebar({
  nav,
  kind,
  identity,
  current,
  canSwitch,
  otherView,
  onSearch,
  onSwitch,
}: {
  nav: ShellNav;
  kind: ShellKind;
  identity: ShellIdentity;
  current: ShellCooperative | null;
  canSwitch: boolean;
  otherView: { href: string; label: string } | null;
  onSearch: () => void;
  onSwitch: () => void;
}) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeToRail, readRail, () => false);
  const shortcut = useShortcutLabel();
  const asideRef = useRef<HTMLElement>(null);
  const fits = useFitsWindow(asideRef);
  const staff = kind === "admin" || kind === "officer";

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
      ref={asideRef}
      className={cn(
        "hidden shrink-0 flex-col self-start border-r border-hairline bg-surface lg:flex",
        // Walkthrough 1.4d item 5: pinned beside the page while it fits the window; on a short
        // window it simply scrolls with the page, so it never grows a scrollbar of its own.
        fits
          ? "sticky top-[var(--clarix-preview-offset,0px)] h-[calc(100dvh-var(--clarix-preview-offset,0px))]"
          : "min-h-[calc(100dvh-var(--clarix-preview-offset,0px))]",
      )}
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className={cn("flex h-16 shrink-0 items-center px-3", collapsed ? "justify-center" : "justify-between pl-5")}>
        {collapsed ? null : (
          <Link href={nav.home} aria-label="Clarix home" className="rounded-sm">
            <Wordmark />
          </Link>
        )}
        <Button
          variant="icon"
          onClick={toggle}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <PanelLeftOpen aria-hidden /> : <PanelLeftClose aria-hidden />}
        </Button>
      </div>

      <div className="flex shrink-0 flex-col gap-2 px-3">
        {staff && current ? (
          canSwitch ? (
            <button
              type="button"
              onClick={onSwitch}
              aria-label={`Working in ${current.name}. Switch cooperative`}
              title={collapsed ? current.name : undefined}
              className={cn(
                "flex h-12 items-center gap-3 rounded-md text-left transition-colors duration-[var(--duration-quick)] ease-[var(--ease-quick)] hover:bg-surface-sunken",
                collapsed ? "justify-center" : "px-2",
              )}
            >
              <CooperativeLabel cooperative={current} collapsed={collapsed} />
              {collapsed ? null : <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-ink-500" strokeWidth={1.75} />}
            </button>
          ) : (
            <div className={cn("flex h-12 items-center gap-3", collapsed ? "justify-center" : "px-2")} title={collapsed ? current.name : undefined}>
              <CooperativeLabel cooperative={current} collapsed={collapsed} />
            </div>
          )
        ) : null}

        {collapsed ? (
          <Button variant="icon" onClick={onSearch} aria-label={`Search (${shortcut})`} className="self-center">
            <Search aria-hidden />
          </Button>
        ) : (
          <button
            type="button"
            onClick={onSearch}
            aria-keyshortcuts="Control+K Meta+K"
            className="flex h-10 items-center gap-2 rounded-sm border border-hairline-strong bg-surface px-3 text-ink-500 transition-colors duration-[var(--duration-quick)] ease-[var(--ease-quick)] hover:bg-surface-sunken"
          >
            <Search aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
            <span className="type-small flex-1 text-left">Search</span>
            <kbd className="type-small font-[inherit] text-ink-500">{shortcut}</kbd>
          </button>
        )}
      </div>

      <nav aria-label="Main" className="mt-2 flex-1 px-3 pb-4">
        {nav.groups.map((group, index) => (
          <div key={group.label ?? index}>
            {group.label ? (
              collapsed ? (
                <div aria-hidden className="mx-3 my-4 h-px bg-hairline" />
              ) : (
                <p className="type-small px-3 pt-6 pb-2 text-ink-500">{group.label}</p>
              )
            ) : null}
            <ul className="flex flex-col gap-1" aria-label={group.label}>
              {group.items.map((item) => (
                <li key={item.href}>
                  <SidebarLink item={item} active={isNavActive(pathname, item, nav.home)} collapsed={collapsed} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-hairline p-3">
        <AccountMenu nav={nav} kind={kind} identity={identity} current={current} collapsed={collapsed} otherView={otherView} />
      </div>
    </aside>
  );
}

function CooperativeLabel({ cooperative, collapsed }: { cooperative: ShellCooperative; collapsed: boolean }) {
  return (
    <>
      <CooperativeMark name={cooperative.name} />
      {collapsed ? null : (
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="type-small truncate text-ink-900">{cooperative.name}</span>
          <span className="type-small truncate text-ink-500">{cooperative.roleLabel}</span>
        </span>
      )}
    </>
  );
}

function SidebarLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "type-body flex h-10 items-center gap-3 rounded-sm transition-colors duration-[var(--duration-quick)] ease-[var(--ease-quick)]",
        collapsed ? "justify-center" : "px-3",
        active ? "bg-emerald-50 font-medium text-emerald-700" : "text-ink-900 hover:bg-surface-sunken",
      )}
    >
      <Icon aria-hidden className={cn("size-5 shrink-0", active ? "text-emerald-700" : "text-ink-500")} strokeWidth={1.75} />
      {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
    </Link>
  );
}

/* ---------------------------------------------------------------------------
   Desktop: account menu
--------------------------------------------------------------------------- */

const menuItemClass =
  "type-small flex h-10 w-full cursor-default items-center gap-3 rounded-sm px-3 text-ink-900 data-[highlighted]:bg-surface-sunken";

function AccountMenu({
  nav,
  kind,
  identity,
  current,
  collapsed,
  otherView,
}: {
  nav: ShellNav;
  kind: ShellKind;
  identity: ShellIdentity;
  current: ShellCooperative | null;
  collapsed: boolean;
  otherView: { href: string; label: string } | null;
}) {
  const subtitle = kind === "platform" ? "Platform" : kind === "member" ? "Member" : current?.roleLabel ?? "Staff";
  const [signingOut, startSignOut] = useTransition();

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Account: ${identity.name}`}
        className={cn(
          "flex h-12 w-full items-center gap-3 rounded-md text-left transition-colors duration-[var(--duration-quick)] ease-[var(--ease-quick)] hover:bg-surface-sunken data-[popup-open]:bg-surface-sunken",
          collapsed ? "justify-center" : "px-2",
        )}
      >
        <Avatar initials={identity.initials} />
        {collapsed ? null : (
          <>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="type-small truncate text-ink-900">{identity.name}</span>
              <span className="type-small truncate text-ink-500">{subtitle}</span>
            </span>
            <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-ink-500" strokeWidth={1.75} />
          </>
        )}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="top" align="start" sideOffset={8} className="z-50">
          <Menu.Popup
            className={cn(
              "w-[224px] rounded-md border border-hairline bg-surface p-1 shadow-raised",
              "origin-[var(--transform-origin)] transition-[opacity,transform] duration-[var(--duration-quick)] ease-[var(--ease-quick)]",
              "data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 motion-reduce:transition-none",
            )}
          >
            <Menu.LinkItem render={<Link href={nav.profile} />} className={menuItemClass}>
              <Settings2 aria-hidden className="size-4 text-ink-500" strokeWidth={1.75} />
              Profile
            </Menu.LinkItem>
            <Menu.LinkItem render={<Link href={nav.help} />} className={menuItemClass}>
              <CircleQuestionMark aria-hidden className="size-4 text-ink-500" strokeWidth={1.75} />
              Help
            </Menu.LinkItem>
            {otherView ? (
              <>
                <Separator className="mx-3 my-1 h-px bg-hairline" />
                <Menu.LinkItem render={<Link href={otherView.href} />} className={menuItemClass}>
                  <ArrowLeftRight aria-hidden className="size-4 shrink-0 text-ink-500" strokeWidth={1.75} />
                  <span className="truncate">{otherView.label}</span>
                </Menu.LinkItem>
              </>
            ) : null}
            <Separator className="mx-3 my-1 h-px bg-hairline" />
            <Menu.Item
              className={menuItemClass}
              closeOnClick={false}
              disabled={signingOut}
              onClick={() => startSignOut(() => signOutAction())}
            >
              {signingOut ? (
                <LoaderCircle aria-hidden className="size-4 animate-spin text-ink-500" />
              ) : (
                <LogOut aria-hidden className="size-4 text-ink-500" strokeWidth={1.75} />
              )}
              Sign out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
