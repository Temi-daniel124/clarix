import type { Metadata } from "next";
import { CooperativeDirectory } from "@/components/platform/cooperative-directory";
import { loadCooperativeDirectory } from "@/lib/supabase/platform-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cooperatives" };

/** Cooperative Directory — super-admin blueprint 5.1. */
export default async function CooperativesPage() {
  const entries = await loadCooperativeDirectory();

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Cooperatives</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        Every cooperative on the platform. Member counts only — what any of them holds for a
        particular person is that cooperative&rsquo;s own record, not this screen&rsquo;s.
      </p>

      <div className="mt-8">
        <CooperativeDirectory entries={entries} />
      </div>
    </div>
  );
}
