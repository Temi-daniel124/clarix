"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { springStandard } from "@/lib/motion";

/**
 * PWA install prompt (employee blueprint 1.2).
 *
 * Not a screen: a small dismissible banner, and only ever on the Dashboard. Never on the
 * landing page and never during onboarding, when the employee hasn't yet seen enough value to
 * want the app installed.
 *
 * Dismissal is honoured properly: hidden immediately, and not asked again for a week. On a
 * supported browser the button triggers the platform's own install prompt; where the browser
 * exposes no such event (notably iOS Safari) the banner explains the Share → Add to Home
 * Screen route rather than pretending a button will do it.
 *
 * The install event itself is captured by a small inline script in the root layout, because
 * Chrome fires it before React hydrates: a listener added in an effect here would simply never
 * see it. This component reads the stash through useSyncExternalStore, which also keeps every
 * piece of browser state out of an effect body.
 */

const SNOOZE_KEY = "clarix.install-prompt.snoozed-until";
const SNOOZE_DAYS = 7;
const AVAILABILITY_EVENT = "clarix:install-availability";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __clarixInstallEvent: InstallPromptEvent | null;
  }
}

export function InstallPrompt() {
  const reduceMotion = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);

  const installAvailable = useSyncExternalStore(
    subscribeToAvailability,
    () => Boolean(window.__clarixInstallEvent),
    () => false,
  );

  const environment = useSyncExternalStore(
    subscribeToAvailability,
    readInstallEnvironment,
    () => SERVER_ENVIRONMENT,
  );

  const dismiss = useCallback(() => {
    setDismissed(true);
    snooze();
  }, []);

  const install = useCallback(async () => {
    const event = window.__clarixInstallEvent;
    if (!event) return;

    await event.prompt();
    await event.userChoice;

    window.__clarixInstallEvent = null;
    window.dispatchEvent(new Event(AVAILABILITY_EVENT));
  }, []);

  const manualOnly = environment.manualOnly && !installAvailable;
  const visible =
    !dismissed &&
    !environment.installed &&
    !environment.snoozed &&
    (installAvailable || environment.manualOnly);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.aside
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={reduceMotion ? { duration: 0 } : springStandard}
          className="flex items-center gap-4 rounded-card border border-border bg-surface px-4 py-3"
          aria-label="Install Clarix"
        >
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-card"
            style={{
              backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)",
              color: "var(--clarix-brand-accent)",
            }}
          >
            <Download className="size-5" strokeWidth={2} />
          </span>

          <p className="type-secondary flex-1 text-text-secondary">
            {manualOnly
              ? "Install Clarix for quicker access, tap Share, then Add to Home Screen."
              : "Install Clarix for quicker access, without opening a browser tab."}
          </p>

          {manualOnly ? null : (
            <Button size="sm" onClick={install}>
              Install
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={dismiss}
            aria-label="Not now"
            className="shrink-0"
          >
            <X className="size-4" strokeWidth={2} />
          </Button>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

type InstallEnvironment = {
  /** Already running as an installed app, never ask again. */
  installed: boolean;
  /** iOS Safari, which fires no beforeinstallprompt and installs manually. */
  manualOnly: boolean;
  /** Dismissed recently enough that asking again would be nagging. */
  snoozed: boolean;
};

const SERVER_ENVIRONMENT: InstallEnvironment = {
  installed: false,
  manualOnly: false,
  snoozed: true,
};

/**
 * The snapshot must be referentially stable or useSyncExternalStore re-renders forever, so it is
 * computed once and only invalidated when something actually changes it.
 */
let cachedEnvironment: InstallEnvironment | null = null;

function readInstallEnvironment(): InstallEnvironment {
  if (cachedEnvironment) return cachedEnvironment;

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as { standalone?: boolean }).standalone);

  const userAgent = window.navigator.userAgent;
  const isIosSafari = /iphone|ipad|ipod/i.test(userAgent) && !/crios|fxios/i.test(userAgent);

  cachedEnvironment = {
    installed: standalone,
    manualOnly: isIosSafari,
    snoozed: isSnoozed(),
  };

  return cachedEnvironment;
}

function subscribeToAvailability(onChange: () => void) {
  window.addEventListener(AVAILABILITY_EVENT, onChange);
  return () => window.removeEventListener(AVAILABILITY_EVENT, onChange);
}

function isSnoozed(): boolean {
  try {
    const until = window.localStorage.getItem(SNOOZE_KEY);
    return Boolean(until) && Number(until) > Date.now();
  } catch {
    return false;
  }
}

function snooze() {
  try {
    const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(SNOOZE_KEY, String(until));
    cachedEnvironment = null;
  } catch {
    // Storage unavailable (private window, blocked site data): the banner simply reappears
    // next session, which is the lesser failure.
  }
}
