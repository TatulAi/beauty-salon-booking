// Runs before first paint (blocking, in <head>) to apply a saved light/dark
// choice and avoid a flash of the wrong theme. Kept in sync with
// src/theme/ThemeContext.tsx: same storage key, same `data-theme` attribute.
// 'system' (or no value) is left as-is so the CSS media query decides.
try {
  var t = localStorage.getItem('beauty-salon-theme')
  if (t === 'light' || t === 'dark') {
    document.documentElement.dataset.theme = t
  }
} catch {
  // localStorage blocked (private mode, etc.) — fall back to the media query
}
