import Image from "next/image";
import { cn } from "@/lib/utils";
import { ROLES, ROLES_HEADING } from "./copy";
import { SECTION } from "./section";

/**
 * Who does what (spec §11.1; round-2 board): three photo cards, one per role, each a real
 * photograph over the role and what Clarix does for it. Below the fold, so every photo loads
 * lazily at the width it is drawn.
 */
export function Roles() {
  return (
    <section aria-labelledby="roles-heading" className={cn(SECTION, "reveal")}>
      <h2
        id="roles-heading"
        className="type-page-title mb-8 max-w-[760px] text-balance text-indigo-night lg:mb-10"
      >
        {ROLES_HEADING}
      </h2>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ROLES.map((role) => (
          <li
            key={role.label}
            className="flex flex-col overflow-hidden rounded-sheet bg-white shadow-flat"
          >
            <div className="relative h-[240px] bg-indigo-100 lg:h-[260px]">
              <Image
                src={role.photo.src}
                alt={role.photo.alt}
                fill
                loading="lazy"
                sizes="(min-width: 1240px) 403px, (min-width: 768px) 33vw, 100vw"
                className="object-cover"
                style={{ objectPosition: role.photo.position }}
              />
            </div>
            <div className="flex flex-col gap-2 p-6">
              <p className="text-[14px] leading-[1.4] font-bold text-indigo-600">{role.label}</p>
              <h3 className="font-display text-[22px] leading-[1.15] font-[750] tracking-[-0.03em] text-indigo-night">
                {role.title}
              </h3>
              <p className="text-[16px] leading-[1.55] text-ink-2">{role.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
