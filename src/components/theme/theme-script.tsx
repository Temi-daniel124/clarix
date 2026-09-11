/**
 * Applies the viewer's saved colour-scheme choice before the browser paints.
 *
 * This has to be a blocking inline script in the document, not an effect: if the class were
 * applied after hydration, someone who has chosen light would get a flash of the dark palette
 * (or the reverse) on every page load. It reads one key and sets at most one class, so it stays
 * small enough to be worth blocking on.
 *
 * It also restores the sidebar's collapsed/expanded state, for the same reason: the rail's width
 * is driven by a class on the root element, so it is correct on the first paint rather than
 * snapping from one width to the other after hydration.
 *
 * A class rather than a `data-` attribute, so the rail uses exactly the same mechanism as the
 * colour scheme above and there is only one thing to reason about. Note that `next dev` resets
 * the root element's className during hydration, so while developing both preferences can look
 * as though they did not persist; in a production build they do.
 *
 * The three colour-scheme states match what the stylesheet already understands:
 *   "light"  -> the `light` class, which opts the document out of the prefers-color-scheme
 *               dark override in globals.css
 *   "dark"   -> the `dark` class, which forces the dark palette
 *   "system" -> no class at all, leaving prefers-color-scheme in charge
 */

export const THEME_STORAGE_KEY = "clarix.theme";
export const SIDEBAR_STORAGE_KEY = "clarix.sidebar";

const SCRIPT = `(function(){
  var root = document.documentElement;
  try {
    var choice = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    root.classList.remove('light', 'dark');
    if (choice === 'light' || choice === 'dark') root.classList.add(choice);
  } catch (e) {
    // Storage blocked (private window, blocked site data). The system preference still
    // applies through CSS, so there is nothing to recover from.
  }
  try {
    var rail = localStorage.getItem(${JSON.stringify(SIDEBAR_STORAGE_KEY)});
    root.classList.toggle('rail-collapsed', rail === 'collapsed');
  } catch (e) {
    // Storage blocked; the rail simply starts expanded.
  }
})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
