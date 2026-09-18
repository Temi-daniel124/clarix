import { LoadingScreen } from "@/components/clarix/loading-ring";

/**
 * The loading boundary for the platform shell.
 *
 * Every screen behind this shell is `force-dynamic`, which means Next has nothing it can
 * prefetch and nothing to show between the click and the answer. Without a boundary the previous
 * screen simply sits there, and on a slow connection the product reads as frozen rather than
 * busy.
 *
 * This renders inside the shell's own `<main>`, so the navigation stays put and only the content
 * area changes. Nothing about a loaded screen is affected: this is what fills the gap before one
 * arrives, and it is replaced the instant the real thing is ready.
 */
export default function Loading() {
  return <LoadingScreen label="Loading" />;
}
