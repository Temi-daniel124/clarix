/**
 * Applies the viewer's saved colour-scheme choice before the browser paints.
 *
 * This has to be a blocking inline script in the document, not an effect: if the class were
 * applied after hydration, someone who has chosen light would get a flash of the dark palette
 * (or the reverse) on every page load. It reads one key and sets at most one class, so it stays
 * small enough to be worth blocking on.
 *
 * The three states match what the stylesheet already understands:
 *   "light"  -> the `light` class, which opts the document out of the prefers-color-scheme
 *               dark override in globals.css
 *   "dark"   -> the `dark` class, which forces the dark palette
 *   "system" -> no class at all, leaving prefers-color-scheme in charge
 */

export const THEME_STORAGE_KEY = "clarix.theme";

const SCRIPT = `(function(){
  try {
    var choice = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (choice === 'light' || choice === 'dark') root.classList.add(choice);
  } catch (e) {
    // Storage blocked (private window, blocked site data). The system preference still
    // applies through CSS, so there is nothing to recover from.
  }
})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
