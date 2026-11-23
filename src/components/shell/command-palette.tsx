"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The command palette (DESIGN_SYSTEM §5.5, §5.6 "Command Search"): `Ctrl/⌘ K`, or the sidebar's
 * Search field. Type to filter, arrows to move, Enter to go. It only lists places this person can
 * already reach from their navigation, so it is a faster way there, never a back door.
 */

export type PaletteCommand = {
  id: string;
  label: string;
  group: string;
  icon: LucideIcon;
  /** A route to open, or an action to run. */
  href?: string;
  run?: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  commands,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: PaletteCommand[];
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/24",
            "transition-opacity duration-[var(--duration-quick)] ease-[var(--ease-quick)]",
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed top-24 left-1/2 z-50 flex max-h-[min(480px,calc(100dvh-192px))] w-[560px] max-w-[calc(100vw-32px)]",
            "-translate-x-1/2 flex-col overflow-hidden rounded-lg border border-hairline bg-surface shadow-raised",
            "transition-[opacity,transform] duration-[var(--duration-quick)] ease-[var(--ease-quick)]",
            "data-[starting-style]:-translate-y-2 data-[starting-style]:opacity-0",
            "data-[ending-style]:-translate-y-2 data-[ending-style]:opacity-0 motion-reduce:transition-none",
          )}
        >
          <Dialog.Title className="sr-only">Search Clarix</Dialog.Title>
          {/* Remounted on every open, so it always starts empty with the first result highlighted. */}
          {open ? <PaletteBody commands={commands} onDone={() => onOpenChange(false)} /> : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PaletteBody({ commands, onDone }: { commands: PaletteCommand[]; onDone: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((command) => command.label.toLowerCase().includes(needle));
  }, [commands, query]);

  useEffect(() => {
    document.getElementById(`palette-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function choose(command: PaletteCommand | undefined) {
    if (!command) return;
    onDone();
    if (command.run) command.run();
    else if (command.href) router.push(command.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[active]);
    }
  }

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-hairline px-4">
        <Search aria-hidden className="size-5 shrink-0 text-ink-500" strokeWidth={1.75} />
        <input
          autoFocus
          type="text"
          role="combobox"
          aria-expanded
          aria-controls="palette-results"
          aria-activedescendant={results.length > 0 ? `palette-option-${active}` : undefined}
          aria-label="Search Clarix"
          placeholder="Where to?"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="type-body min-w-0 flex-1 bg-transparent text-ink-900 placeholder:text-ink-500 focus-visible:outline-none"
        />
      </div>

      {results.length === 0 ? (
        <p className="type-body px-4 py-6 text-ink-500">Nothing matches “{query.trim()}”.</p>
      ) : (
        <ul id="palette-results" role="listbox" aria-label="Results" className="overflow-y-auto p-2">
          {results.map((command, index) => {
            const Icon = command.icon;
            const startsGroup = index === 0 || results[index - 1].group !== command.group;
            return (
              <li key={command.id} role="presentation">
                {startsGroup ? (
                  <p role="presentation" className={cn("type-small px-3 pb-1 text-ink-500", index > 0 ? "pt-4" : "pt-2")}>
                    {command.group}
                  </p>
                ) : null}
                <div
                  id={`palette-option-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseMove={() => setActive(index)}
                  onClick={() => choose(command)}
                  className={cn(
                    "flex h-11 cursor-pointer items-center gap-3 rounded-sm px-3 type-body text-ink-900",
                    index === active && "bg-surface-sunken",
                  )}
                >
                  <Icon aria-hidden className="size-5 shrink-0 text-ink-500" strokeWidth={1.75} />
                  <span className="truncate">{command.label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
