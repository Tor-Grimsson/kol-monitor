# Monitor

Monitor is a browser-based modular video synthesizer built on the language of eurorack. Where eurorack uses voltage as its universal medium, Monitor uses pure math — parametric equations and trigonometry generate geometry instead of pushing pixels. Its rack engine, Video Modulo, runs fifty-nine modules across five categories (control, math, generators, display, utility) connected through virtual patch cables, evaluated in topological order, and rendered at 60fps on Canvas2D. No WebGL, no shaders, no pixel buffers — just `Math.sin`, `Math.cos`, and a well-sorted render loop. The two exceptions are the Raster and Slit-Echo displays, which work on pixels.

**Live:** https://monitor.kolkrabbi.io

## Getting Started

```sh
pnpm install
pnpm dev
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server (`vite --force`) |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm icons` | Generate the app icons and share image from the SVG source |
| `pnpm check:stages` | Check every port a stage names exists on its module |
| `pnpm check:inks` | Count raw colour literals in the modules |
| `pnpm check:library-merge` | Test the sign-in library merge |
| `pnpm generate-previews` | Generate module preview images |
| `pnpm generate-videos` | Generate module preview videos |
| `pnpm api:dev` | Run the API worker locally on port 8787 |
| `pnpm api:schema` | Apply `api/schema.sql` to the remote D1 database |
| `pnpm api:schema:local` | Apply `api/schema.sql` to the local D1 database |
| `pnpm api:deploy` | Deploy the API worker |

## Tech Stack

- React 19 + Vite 8
- Tailwind CSS 4
- Kolkrabbi Design System (typography, color tokens)
- API: a Cloudflare Worker with D1 (`api/`, monitor-api.kolkrabbi.io) that syncs saved patches when signed in
