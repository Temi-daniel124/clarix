import type { Metadata } from "next";
import { FOR_MEMBERS_PAGE } from "@/components/marketing/copy";
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
      <SiteFooter />
    </>
  );
}
