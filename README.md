# Monitor

Monitor is a browser-based modular video synthesizer built on the language of eurorack. Where eurorack uses voltage as its universal medium, Monitor uses pure math — parametric equations and trigonometry generate geometry instead of pushing pixels. Its rack engine, Video Modulo, runs fifty modules across five categories (control, math, generators, display, utility) connected through virtual patch cables, evaluated in topological order, and rendered at 60fps on Canvas2D. No WebGL, no shaders, no pixel buffers — just `Math.sin`, `Math.cos`, and a well-sorted render loop.

**Live:** https://monitor.kolkrabbi.io

## Getting Started

```sh
pnpm install
pnpm dev
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |

## Tech Stack

- React 19 + Vite 7
- Tailwind CSS 4
- Three.js (3D geometry)
- Kolkrabbi Design System (typography, color tokens)
