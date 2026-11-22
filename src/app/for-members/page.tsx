import type { Metadata } from "next";
import { FOR_MEMBERS_PAGE, PHOTO_CREDITS } from "@/components/marketing/copy";
import {
  FreeAlways,
  JoinSteps,
  MemberView,
  MembersIntro,
} from "@/components/marketing/for-members";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { pageMetadata } from "@/lib/site";

/**
 * For members (spec §11.1; §11.4; D038): what a member sees, how to join, and that it is free.
 * The one primary is "Find your cooperative"; the nav's "Start free trial" stays secondary, and
 * there is no cooperative trial card here, because a member never starts one.
 */
// The page's one photograph, market.jpg, is Tunde Buremo's (public/images/landing/CREDITS.md).
const MEMBER_PAGE_CREDITS = PHOTO_CREDITS.filter((credit) => credit.name === "Tunde Buremo");

const title = FOR_MEMBERS_PAGE.metaTitle;
const description = FOR_MEMBERS_PAGE.metaDescription;

export const metadata: Metadata = {
  title,
  description,
  ...pageMetadata("/for-members", { title, description }),
};

export default function ForMembersPage() {
  return (
    <>
      <SiteNav />
      <main className="flex flex-1 flex-col">
        <MembersIntro />
        <JoinSteps />
        <MemberView />
        <FreeAlways />
      </main>
      <SiteFooter credits={MEMBER_PAGE_CREDITS} />
    </>
  );
}
