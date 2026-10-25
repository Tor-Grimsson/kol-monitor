// `pnpm dev` — the app AND its D1 Worker, one command (kol-fxr's, 2026-10-24).
//
//   1. applies api/schema.sql to wrangler's local SQLite (idempotent — CREATE IF NOT EXISTS)
//   2. starts the Worker on 8789 (fixed per app: fxr 8787, mirror 8788, monitor 8789) against that local database (api/.dev.vars holds the password)
//   3. starts Vite with VITE_MONITOR_API pointed at it, so the rail shows Sign in
//
// Ctrl+C stops both. `pnpm dev:app` is Vite alone — against the API `.env.local` names (the live one), or none.
// Set VITE_MONITOR_API yourself to point the app elsewhere (e.g. the deployed Worker).
import { spawn } from 'node:child_process'

const API = process.env.VITE_MONITOR_API ?? 'http://127.0.0.1:8789'
const port = new URL(API).port || '8789'
const bin = (name) => new URL(`../node_modules/.bin/${name}`, import.meta.url).pathname
/* each child in its OWN process group, started from its binary (no `pnpm exec` wrapper in between),
   so stopping means killing the group — a signal to this script alone must take both down */
const run = (name, args, extraEnv = {}) => spawn(bin(name), args, { stdio: 'inherit', detached: true, env: { ...process.env, ...extraEnv } })

const schema = run('wrangler', ['d1', 'execute', 'kol-monitor', '--local', '--file', 'api/schema.sql', '--config', 'api/wrangler.toml'])
await new Promise((res) => schema.on('exit', res))

const procs = [
  run('wrangler', ['dev', '--config', 'api/wrangler.toml', '--port', port]),
  run('vite', ['--force'], { VITE_MONITOR_API: API }),
]
let stopping = false
const stop = () => { if (stopping) return; stopping = true; for (const p of procs) { try { process.kill(-p.pid, 'SIGTERM') } catch { /* already gone */ } } }
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { stop(); setTimeout(() => process.exit(0), 300) })
for (const p of procs) p.on('exit', (code) => { if (!stopping) { stop(); setTimeout(() => process.exit(code ?? 0), 300) } })
