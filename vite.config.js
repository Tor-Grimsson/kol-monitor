import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { THEME_BOOT_SCRIPT } from '@kolkrabbi/kol-framework/src/theme.js'
import { devFavicon, loaderApp } from '@kolkrabbi/kol-framework/vite'

/* The no-flash theme boot — kol-framework's own snippet (0.28.0), inlined
   before the app script so the stored choice stamps data-theme pre-paint
   (ShellHomeSystem; replaces the re-stamp main.jsx used to do post-load). */
const themeBoot = {
  name: 'kol-theme-boot',
  transformIndexHtml(html) {
    return html.replace(/<!-- kol-theme-boot[^>]*-->/, `<script>${THEME_BOOT_SCRIPT}</script>`)
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    /* the dev tab's tile and the app loader are the KOL's (kol-framework 0.50.0, ticket AppLoader) */
    devFavicon({ label: 'M', ground: '#CE4646' }),
    themeBoot,
    loaderApp({ graphic: 'public/svg/wordmark.svg', size: 166 }),
  ],
  // One react / react-dom copy — the DS packages peer-depend on React, and a
  // duplicated copy crashes at runtime with a null dispatcher.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  // kol-icons builds its registry via `import.meta.glob(...svg)`. Globs only
  // expand when Vite source-transforms a file — a pre-bundled node_modules dep
  // leaves them empty, so every kol-icons glyph resolves to "not found" in dev.
  // ALL the raw-source KOL packages since 2026-10-15 (kol-mirror's shape): since kol-component
  // 0.240.0 `PdfPage.jsx` does `import('pdfjs-dist/…?url')`, which the optimizer reads as a literal
  // filename and fails the whole dev start ("Error during dependency optimization"; fxr hit it
  // 2026-10-07, mirror 2026-10-13, monitor on its 0.261.0 bump). Excluded, they ride the plugin
  // pipeline like app source; their CJS deps then skip the optimizer's interop, so those are
  // pre-bundled by name. Stale-after-bump is `vite --force` in the dev script.
  optimizeDeps: {
    exclude: [
      '@kolkrabbi/kol-icons',
      '@kolkrabbi/kol-component',
      '@kolkrabbi/kol-framework',
      '@kolkrabbi/kol-brand',
      '@kolkrabbi/kol-shell',
      '@kolkrabbi/kol-theme',
      '@kolkrabbi/kol-hardware',
    ],
    include: [
      '@kolkrabbi/kol-component > react-syntax-highlighter',
      '@kolkrabbi/kol-component > embla-carousel-react',
    ],
  },
  server: {
    host: true,
    /* kol-media's R2 store, same-origin (plan 13 W7, kol-mirror's proxy): `r2.kolkrabbi.io` sends no
       Access-Control-Allow-Origin, and a picked file is fetched and read here. `/media/` is
       kol-media-client's default proxyPath, so `proxied()` needs no configuration. */
    proxy: {
      '/media': {
        target: 'https://r2.kolkrabbi.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/media/, ''),
      },
    },
  },
})
