import type { Metadata } from "next";
import { CreateCooperativeForm } from "@/components/platform/create-cooperative-form";

export const metadata: Metadata = { title: "Create a cooperative" };

/** Create Cooperative — super-admin blueprint 5.3. */
export default function CreateCooperativePage() {
  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-8 md:px-8 md:py-10">
      <CreateCooperativeForm />
    </div>
  );
}
