/**
 * Restores the desktop sidebar's collapsed/expanded state before the browser paints.
 *
 * The rail's width is driven by a class on the root element (`rail-collapsed`, globals.css), so it
 * is correct on the first paint rather than snapping from one width to the other after hydration.
 * It has to be a blocking inline script in the document, not an effect, for exactly that reason.
 *
 * Until BUILD-PLAN 1.1 this lived inside ThemeScript, which also applied a colour-scheme choice.
 * Clarix is light only now (D037), so the theme half is gone and only this half remains.
 *
 * Note that `next dev` resets the root element's className during hydration, so while developing
 * the preference can look as though it did not persist; in a production build it does.
 */

export const SIDEBAR_STORAGE_KEY = "clarix.sidebar";

const SCRIPT = `(function(){
  try {
    var rail = localStorage.getItem(${JSON.stringify(SIDEBAR_STORAGE_KEY)});
    document.documentElement.classList.toggle('rail-collapsed', rail === 'collapsed');
  } catch (e) {
    // Storage blocked (private window, blocked site data); the rail simply starts expanded.
  }
})();`;

/**
 * A bare inline `<script>`, deliberately. `next/script` with `beforeInteractive` runs through
 * Next's runtime once the body exists, which is after first paint: the snap this exists to prevent.
 * React logs a development-only warning when it renders this on the client (the 404 and error
 * boundaries); production never emits it.
 */
export function RailScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
