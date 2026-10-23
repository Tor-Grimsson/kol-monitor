import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AppStudio, RailSlotProvider, useNavHidden } from '@kolkrabbi/kol-shell'
import logomarkUrl from '@kolkrabbi/kol-brand/svg/favicon-01.svg?url'
import { ThemeToggle } from '@kolkrabbi/kol-framework'
import { ModalProvider, useModal } from '@kolkrabbi/kol-component/molecules/Modal'
import MediaLibrary from '@kolkrabbi/kol-component/organisms/MediaLibrary'
import { setLibraryApi, getLibraryApi, useLibrarySession, signInLibrary, signOutLibrary, UnauthorizedError } from './hooks/librarySync.js'
import { client as mediaClient } from './hooks/useMediaLibrary.js'
import { publishMediaPick } from './hooks/mediaPick.js'
import { RackProvider } from './hooks/useRackContext.jsx'
import VideoModulo from './rack/VideoModulo.jsx'
import { useHomeProps } from './pages/HomePage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import ModuleDetailPage from './pages/ModuleDetailPage.jsx'
import PatchDetailPage from './pages/PatchDetailPage.jsx'
import { SettingsContent, AboutContent } from './pages/SettingsPage.jsx'
import CreatePage from './pages/CreatePage.jsx'
import StagePage from './pages/StagePage.jsx'
import { SHORTCUT_SECTIONS } from './data/shortcuts.js'
import { DEV_TABS } from './pages/devTabs.jsx'

/* Where the saves sync to (`api/`, `monitor-api.kolkrabbi.io` — plan 13 W7). Unset — the `pnpm dev`
   default without `.env.local` — there is no Sign in and everything is localStorage, as before. */
setLibraryApi(import.meta.env.VITE_MONITOR_API)

/* localhost only (user 2026-10-17): the Dev rail page and the preview-capture target never ship */
const DevCapturePage = import.meta.env.DEV ? lazy(() => import('./pages/dev/DevCapturePage.jsx')) : null

/* THE APP, as the Hub reads it: Home's masthead, the mark's title, About and the repo links on
   Settings. The logomark ships from kol-brand. */
const APP = {
  name: 'Monitor',
  subtitle: 'Video synthesis workstation',
  logomark: logomarkUrl,
  about: <AboutContent />,
  links: [
    { label: 'GitHub', url: 'https://github.com/Tor-Grimsson/kol-monitor' },
    { label: 'Kolkrabbi', url: 'https://monitor.kolkrabbi.io' },
    { label: 'Vercel', url: 'https://kol-monitor-six.vercel.app/' },
  ],
}

/* Rail order, mark first — the sequence the ⌥ prefix walks (Settings is not in it) */
const NAV_PATHS = ['/', '/library', '/create', '/rack', '/stage']
const PREFIX_WINDOW_MS = 1200

/* ⌥ works BOTH ways (user, 2026-08-28): the chord ⌥+1, and tmux-style — tap ⌥ alone, let go,
   then press a digit. The Hub's `navKeys` does only the chord and listens on the same window, so
   it is OFF (`shell.navKeys: false`) and this replaces it.
   "Alone" is the whole trick: any other key, pointer or wheel between ⌥ down and ⌥ up means the
   user was reaching for ⌥-click knob reset or ⌥-wheel zoom, and nothing arms. Capture phase +
   stopImmediatePropagation so the consumed digit never also reaches the rack's 1–9 snap-view binding. */
function useAltPrefixNav(navigate) {
  useEffect(() => {
    let armed = false
    let alone = false
    let timer = null
    const disarm = () => { armed = false; clearTimeout(timer) }
    const busy = () => { alone = false; disarm() }

    const onKeyDown = (e) => {
      if (e.key === 'Alt') { if (!e.repeat) alone = true; return }
      /* BOTH forms fire: any non-Alt key ends the "alone" run, so a chord cannot also arm the
         prefix on the ⌥ release and navigate twice. */
      const chord = e.altKey && !e.metaKey && !e.ctrlKey
      alone = false
      if (!armed && !chord) return
      if (e.target.closest('input, textarea, [contenteditable]')) { disarm(); return }
      /* `code`, not `key`: on macOS ⌥+1 emits '¡', so the chord form has no digit in `e.key`. */
      const digit = /^Digit([1-9])$/.exec(e.code)
      disarm()
      if (!digit) return
      const n = Number(digit[1])
      if (n <= NAV_PATHS.length) {
        e.preventDefault()
        e.stopImmediatePropagation()
        navigate(NAV_PATHS[n - 1])
      }
    }
    const onKeyUp = (e) => {
      if (e.key !== 'Alt' || !alone) return
      alone = false
      armed = true
      clearTimeout(timer)
      timer = setTimeout(() => { armed = false }, PREFIX_WINDOW_MS)
    }

    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('pointerdown', busy)
    window.addEventListener('wheel', busy, { passive: true })
    window.addEventListener('blur', busy)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('pointerdown', busy)
      window.removeEventListener('wheel', busy)
      window.removeEventListener('blur', busy)
    }
  }, [navigate])
}

/* Publishes `--monitor-rail` — the rail's width, or 0 when hidden — so Create's FIXED bottom bar
   keeps clear of it; AppShell only offsets in-flow content. Inside AppShell (it reads its
   NavHiddenContext), so it wraps the page, not the Studio. */
function RailFrame({ children }) {
  const nav = useNavHidden()
  return (
    <div className="contents" style={{ '--monitor-rail': !nav || nav.navHidden ? '0px' : 'var(--kol-shell-rail-width)' }}>
      {children}
    </div>
  )
}

/* The rail's two sign-in rows are sentinels: they act, they do not route (kol-mirror's, plan 13 W7). */
const SIGN_IN_PATH = '#sign-in'
const MEDIA_PATH = '#media'

/* Sign in · sign out through the KOL modal (kol-mirror's and kol-fxr's) */
function useSignIn() {
  const modal = useModal()
  const session = useLibrarySession()
  return async () => {
    if (session) {
      if (await modal.confirm('Sign out of the sync? Saves stay on this device only.', { okLabel: 'Sign out' })) signOutLibrary()
      return
    }
    const pw = await modal.prompt('Password for the monitor sync:', '')
    if (!pw) return
    try {
      const n = await signInLibrary(pw)
      await modal.alert(`Signed in. ${n} ${n === 1 ? 'save' : 'saves'} in the library; saves now sync, and Media is in the rail.`)
    } catch (e) {
      await modal.alert(e instanceof UnauthorizedError ? 'Wrong password. Still local only.' : `Sign in failed: ${e?.message || e}`)
    }
  }
}

/**
 * Shell — kol-shell's `AppStudio`, 2026-10-15 — kol-mirror's move of 2026-10-14. `library.children`
 * and `create.shell: false` are kol-shell 0.64.0's (`StudioLibraryChildren`, filed from here the same day). Home (`HubHome`), Settings (`HubSettings`), the
 * `S` sheet, `,` and `\` are the Hub's; the Studio routes its slots off `currentPath`.
 *
 * ONE RackProvider above the Studio: Library, Create and the Rack share it, so a case being built
 * on /create survives a trip to a module's page and Back (2026-09-02). The Stage gets its OWN —
 * sharing the rack's would mean loading a stage silently replaces whatever is in the rack.
 * `RailSlotProvider` (kol-shell 0.64.0, `NavRailConsumerSlot`) sits above both, so the rail's opened
 * width carries a slot the rack portals its module catalog into (`RackRailPanel`, via `useRailSlot`).
 */
/* the DS prompt / confirm / alert, app-wide (plan 13 W6) — Patch Clear, a bad import, sign-in */
function Shell() {
  return <ModalProvider><ShellBody /></ModalProvider>
}

function ShellBody() {
  const location = useLocation()
  const navigate = useNavigate()
  const modal = useModal()
  const { home, walkthrough } = useHomeProps()
  const session = useLibrarySession()
  const signIn = useSignIn()
  const [mediaOpen, setMediaOpen] = useState(false)
  useAltPrefixNav(navigate)

  /* the pinned foot: Media (signed in) and Sign in (when there is an API) above Settings. A
     `shell.bottomItems` replaces the Hub's own list, so Settings is named here too. */
  const bottomItems = [
    ...(session ? [{ icon: 'image', path: MEDIA_PATH, label: 'Media' }] : []),
    ...(getLibraryApi() ? [{ icon: session ? 'cloud' : 'user', path: SIGN_IN_PATH, label: session ? 'Synced · sign out' : 'Sign in' }] : []),
    { icon: 'nav-settings', path: '/settings', label: 'Settings' },
  ]
  const onNavigate = (path) => {
    if (path === SIGN_IN_PATH) return signIn()
    if (path === MEDIA_PATH) return setMediaOpen(true)
    navigate(path)
  }
  /* a pick goes out through the one seam (`mediaPick`); today the SVG module takes an .svg */
  const onMediaPick = (url) => {
    setMediaOpen(false)
    const name = decodeURIComponent(url.split('/').pop())
    if (!/\.svg$/i.test(name)) return modal.alert('The SVG module takes .svg files.')
    if (!publishMediaPick({ url: mediaClient.proxied(url), name })) modal.alert('Add an SVG module to the rack to use this file.')
  }

  return (
    <>
    <RailSlotProvider>
      <RackProvider>
        {/* keyed on the session: signing in or out remounts the shell, so Home re-picks its tab (SAVED out,
            RECENT in). Rack state lives above it, in RackProvider, and survives. */}
        <AppStudio
          key={session ? 'signed-in' : 'signed-out'}
          app={APP}
          currentPath={location.pathname}
          onNavigate={onNavigate}
          shortcuts={SHORTCUT_SECTIONS}
          walkthrough={walkthrough}
          /* the Settings masthead toggle — a NODE, because kol-framework is not a peer of kol-shell */
          themeToggle={<ThemeToggle fill="none" tone="sunken" label={false} size="sm" />}
          home={home}
          library={{
            children: (
              <Routes>
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/library/:moduleType" element={<ModuleDetailPage />} />
                <Route path="/library/patch/:patchName" element={<PatchDetailPage />} />
              </Routes>
            ),
          }}
          create={{ shell: false, children: <RailFrame><CreatePage /></RailFrame> }}
          use={{
            path: '/rack', label: 'Rack', icon: 'nav-rack',
            children: (
              <Routes>
                <Route path="/rack" element={<VideoModulo />} />
                <Route path="/rack/preset/:presetName" element={<VideoModulo />} />
                <Route path="/rack/patch/:presetName" element={<VideoModulo />} />
              </Routes>
            ),
          }}
          pages={[{
            path: '/stage', icon: 'video', label: 'Stage',
            children: (
              <RackProvider initialRows={[]}>
                <Routes>
                  <Route path="/stage" element={<StagePage />} />
                  <Route path="/stage/:stageName" element={<StagePage />} />
                </Routes>
              </RackProvider>
            ),
          },
          ]}
          dev={DEV_TABS ? { tabs: DEV_TABS } : undefined}
          settings={{ content: <SettingsContent /> }}
          shell={{
            /* THE DRAWER ON EVERY ROUTE below 768, Home included (user, 2026-09-02) — not the Hub's
               phone bar: monitor's Home is a catalog, and the rail is a tap away */
            touch: 'drawer',
            drawerBelow: 768,
            /* the ⌥ chord AND prefix are `useAltPrefixNav`'s — both listen on window */
            navKeys: false,
            bottomItems,
          }}
        />
      </RackProvider>
    </RailSlotProvider>
    <MediaLibrary variant="picker" open={mediaOpen} client={mediaClient} accept={['image']} onClose={() => setMediaOpen(false)} onSelect={onMediaPick} />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          {DevCapturePage && <Route path="/dev/capture" element={<DevCapturePage />} />}
          {/* the Studio routes itself off `currentPath` — one catch-all hands it every other path */}
          <Route path="*" element={<Shell />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
