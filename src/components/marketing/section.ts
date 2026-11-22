/**
 * Shared measurements for the landing sections, from the round-2 landing board: the 1240 content
 * column with the hero's gutters, and the space under each section. The board's 104px is taken
 * to 96 on the spec §4 spacing scale; phones get 72.
 */
export const SECTION = "mx-auto w-full max-w-[1240px] px-5 pb-[72px] md:px-6 lg:pb-24";

/** The small indigo line above a section heading. */
export const EYEBROW = "type-body-s leading-[1.4] font-bold text-indigo-600";

/** Landing paragraph beside or under a section heading (Body-L, spec §3). */
export const LEAD = "type-body-lg text-ink-2";
