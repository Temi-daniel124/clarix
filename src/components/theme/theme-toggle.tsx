"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_STORAGE_KEY } from "./theme-script";

/**
 * Colour-scheme control. The product had no way to choose one before this, which meant an
 * employee on a phone stuck in dark mode had no recourse if they preferred the light palette on
 * a screen full of figures.
 *
 * Three states rather than two, deliberately: "system" is the default and stays the default, so
 * the app keeps following the phone's own day/night behaviour unless someone actively opts out.
 * A plain two-way switch would silently pin the choice on first use.
 *
 * Rendered as a segmented control rather than a cycling button so the current state is legible
 * at a glance — on a toggle that cycles, you cannot tell "dark because I chose dark" from
 * "dark because my phone is dark".
 */

type ThemeChoice = "light" | "dark" | "system";

const OPTIONS: Array<{ value: ThemeChoice; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
];

const CHANGE_EVENT = "clarix:theme-change";

export function ThemeToggle({ className, tone = "default" }: { className?: string; tone?: "default" | "onDark" }) {
  const choice = useSyncExternalStore(subscribe, readChoice, () => "system" as ThemeChoice);

  const select = useCallback((next: ThemeChoice) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (next !== "system") root.classList.add(next);

    try {
      if (next === "system") window.localStorage.removeItem(THEME_STORAGE_KEY);
      else window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage blocked; the class is applied either way, it just will not survive a reload.
    }

    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const onDark = tone === "onDark";

  return (
    <div
      role="radiogroup"
      aria-label="Colour scheme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border p-0.5",
        onDark ? "border-white/12 bg-white/[0.06]" : "border-border bg-background",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = choice === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => select(value)}
            className={cn(
              "flex size-7 items-center justify-center rounded-full transition-colors duration-150",
              "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
              selected
                ? onDark
                  ? "bg-white/15 text-white"
                  : "bg-surface text-text"
                : onDark
                  ? "text-white/50 hover:text-white/80"
                  : "text-text-muted hover:text-text-secondary",
            )}
          >
            <Icon className="size-3.5" strokeWidth={2} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readChoice(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Fall through to the system default.
  }
  return "system";
}
