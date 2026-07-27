export const THEME_STORAGE_KEY = "theme";

/**
 * Runs before hydration (see root layout) to apply the persisted or
 * system-preferred theme before first paint, avoiding a flash of the wrong
 * theme. Kept as a plain string since it executes as an inline <script>,
 * outside of React.
 */
export const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored === 'dark' || (stored !== 'light' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {}
})();
`;
