import { notFound } from "next/navigation";

/**
 * Any URL under this console that matches no screen (BUILD-PLAN 1.5). Without this, Next renders
 * the root 404 outside the shell; routing it here keeps the sidebar and tab bar, and the shell's
 * layout still sends someone who is not signed in to sign in first.
 */
export default function Missing() {
  notFound();
}
