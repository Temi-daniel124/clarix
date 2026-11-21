/**
 * Restores the sidebar's collapsed/expanded state before the browser paints.
 *
 * This has to be a blocking inline script in the document, not an effect: the rail's width is
 * driven by a class on the root element, so restoring it here makes it correct on the first paint
 * rather than snapping from one width to the other after hydration. Note that `next dev` resets
 * the root element's className during hydration, so while developing the preference can look as
 * though it did not persist; in a production build it does.
 *
 * Clarix is light only (D033). The script never adds a colour-scheme class, and it clears the
 * theme choice an earlier version saved, so nothing stale lingers in a returning viewer's storage.
 */

export const SIDEBAR_STORAGE_KEY = "clarix.sidebar";

export const THEME_SCRIPT_SOURCE = `(function(){
  var root = document.documentElement;
  try {
    localStorage.removeItem('clarix.theme');
    var rail = localStorage.getItem(${JSON.stringify(SIDEBAR_STORAGE_KEY)});
    root.classList.toggle('rail-collapsed', rail === 'collapsed');
  } catch (e) {
    // Storage blocked (private window, blocked site data); the rail simply starts expanded.
  }
})();`;

/**
 * A bare inline `<script>`, deliberately, and it has to stay one.
 *
 * `next/script` with `beforeInteractive` was tried here and reverted. Next injects that form
 * through its own runtime rather than leaving it in the head to be parsed, so it runs at
 * `document.readyState === "interactive"`, after the body exists: measured, not assumed. Anyone
 * who collapsed the sidebar would see it snap width on every page load, which is the
 * exact problem this file exists to prevent.
 *
 * The cost of keeping it bare is a React warning, "Encountered a script tag while rendering React
 * component", logged whenever React renders this element on the client. That happens on the 404
 * and error boundaries and nowhere else, it is a development-build message that production never
 * emits, and it describes something already true and intended: the script is meant to run from
 * the server-rendered HTML, never from a client render. A visible flash for every member is not
 * worth trading for a console line no member sees.
 */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT_SOURCE }} />;
}
