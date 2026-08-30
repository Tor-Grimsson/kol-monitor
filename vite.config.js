import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { THEME_BOOT_SCRIPT } from '@kolkrabbi/kol-framework/src/theme.js'

/* The no-flash theme boot — kol-framework's own snippet (0.28.0), inlined
   before the app script so the stored choice stamps data-theme pre-paint
   (ShellHomeSystem; replaces the re-stamp main.jsx used to do post-load). */
const themeBoot = {
  name: 'kol-theme-boot',
  transformIndexHtml(html) {
    return html.replace(/<!-- kol-theme-boot[^>]*-->/, `<script>${THEME_BOOT_SCRIPT}</script>`)
  },
}

/* Dev-only favicon — a big MO so dev tabs read apart from prod at a glance.
   `apply: 'serve'` keeps it out of every build (was a runtime swap in main.jsx). */
const devFavicon = {
  name: 'dev-favicon',
  apply: 'serve',
  transformIndexHtml(html) {
    const svg = encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#CE4646"/><text x="16" y="27" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="30" font-weight="900" fill="#FFFFFF">M</text></svg>',
    )
    // REPLACE the prod link — two rel="icon" links and the browser picks its own (Firefox kept prod's)
    return html.replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="data:image/svg+xml,${svg}">`)
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devFavicon, themeBoot],
  // One react / react-dom copy — the DS packages peer-depend on React, and a
  // duplicated copy crashes at runtime with a null dispatcher.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  // kol-icons builds its registry via `import.meta.glob(...svg)`. Globs only
  // expand when Vite source-transforms a file — a pre-bundled node_modules dep
  // leaves them empty, so every kol-icons glyph resolves to "not found" in dev.
  // NOT the other DS packages: kol-component pulls CJS deps that only work
  // pre-bundled. Stale-after-bump is `vite --force` in the dev script.
  optimizeDeps: {
    exclude: ['@kolkrabbi/kol-icons'],
  },
  server: {
    host: true,
  },
})
