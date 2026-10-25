import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppStudio, useNavHidden } from '@kolkrabbi/kol-shell'
import { ModalProvider, useModal } from '@kolkrabbi/kol-component/molecules/Modal'
import { setLibraryApi, getLibraryApi, useLibrarySession, signInLibrary, signOutLibrary, UnauthorizedError } from './hooks/librarySync.js'
import { client as mediaClient } from './hooks/useMediaLibrary.js'
import { publishMediaPick } from './hooks/mediaPick.js'
import { RackProvider } from './hooks/useRackContext.jsx'
import VideoModulo from './rack/VideoModulo.jsx'
import { useHomeProps } from './pages/HomePage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import ModuleDetailPage from './pages/ModuleDetailPage.jsx'
import PatchDetailPage from './pages/PatchDetailPage.jsx'
import { useSettings, ABOUT, LINKS } from './pages/SettingsPage.jsx'
import { useHoverFlip } from './hooks/useHoverFlip'
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
   Settings. The logomark is the repo's own favicon, the MON mark, not kol-brand's (plan 16 W9, user 2026-10-24). */
const APP = {
  name: 'Monitor',
  subtitle: 'Video synthesis workstation',
  logomark: '/svg/favicon.svg',
  about: ABOUT,
  links: LINKS,
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

/* The Sign in row's press — the Hub asks the password or the sign-out confirm in the DS dialog itself,
   then hands over the password, or null for sign out. The outcome goes through the KOL modal. */
function useSignIn() {
  const modal = useModal()
  return async (password) => {
    if (password == null) { signOutLibrary(); return }
    try {
      const n = await signInLibrary(password)
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
 * The nav rail navigates and carries nothing else (RailRolesOnMonitor 2026-10-25 — the module catalog that was
 * portalled into its slot is in `_tmp/2026-10-25-rack-rail-panel/`).
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
  const onPress = useSignIn()
  const settings = useSettings()
  /* THE CARDS' BACK (AppCardWholeFlip, kol-component 0.301.0 — user 2026-10-24: "make the cards flip on a shortcut and
     disable the hover" · "hover flips card? default off"): `F` turns every card on Home and Library; Settings →
     Display → Hover flips card opts the hover in. F is the rack's and the stage's framerate, which mount no cards. */
  const hoverFlip = useHoverFlip()
  const [flipped, setFlipped] = useState(false)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'f' && e.key !== 'F') return
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, textarea, select, [contenteditable]')) return
      if (!/^\/(library)?$/.test(window.location.pathname)) return
      setFlipped((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useAltPrefixNav(navigate)

  /* a pick goes out through the one seam (`mediaPick`); today the SVG module takes an .svg */
  const onMediaPick = (url) => {
    const name = decodeURIComponent(url.split('/').pop())
    if (!/\.svg$/i.test(name)) return modal.alert('The SVG module takes .svg files.')
    if (!publishMediaPick({ url: mediaClient.proxied(url), name })) modal.alert('Add an SVG module to the rack to use this file.')
  }

  return (
      <RackProvider>
        {/* keyed on the session: signing in or out remounts the shell, so Home re-picks its tab (SAVED out,
            RECENT in). Rack state lives above it, in RackProvider, and survives. */}
        <AppStudio
          key={session ? 'signed-in' : 'signed-out'}
          app={APP}
          currentPath={location.pathname}
          onNavigate={navigate}
          shortcuts={SHORTCUT_SECTIONS}
          walkthrough={walkthrough}
          home={{ ...home, backReveal: 'flip-card', flipped, backHover: hoverFlip }}
          library={{
            children: (
              <Routes>
                <Route path="/library" element={<LibraryPage flipped={flipped} backHover={hoverFlip} />} />
                <Route path="/library/patch/:patchName" element={<PatchDetailPage />} />
                <Route path="/library/module/:moduleType" element={<ModuleDetailPage />} />
                {/* the old module slug keeps working */}
                <Route path="/library/:id" element={<LegacyModuleSlug />} />
              </Routes>
            ),
          }}
          create={{ shell: false, bar: false, children: <RailFrame><CreatePage /></RailFrame> }}
          use={{
            path: '/rack', label: 'Rack', icon: 'nav-rack',
            children: (
              <RailFrame>
                <Routes>
                  <Route path="/rack" element={<VideoModulo />} />
                  <Route path="/rack/preset/:presetName" element={<VideoModulo />} />
                  <Route path="/rack/patch/:presetName" element={<VideoModulo />} />
                </Routes>
              </RailFrame>
            ),
          }}
          pages={[{
            /* the Stage owns the phone's bottom edge */
            path: '/stage', icon: 'video', label: 'Stage', bar: false,
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
          settings={settings}
          /* the rail's foot is the Hub's: Media (signed in) and Sign in (when there is an API) above Settings */
          media={session ? { client: mediaClient, accept: ['image'], onSelect: onMediaPick } : undefined}
          signIn={getLibraryApi() ? { signedIn: !!session, onPress } : undefined}
          shell={{
            /* the ⌥ chord AND prefix are `useAltPrefixNav`'s — both listen on window */
            navKeys: false,
          }}
        />
      </RackProvider>
  )
}

/* `/library/<type>` → `/library/module/<type>` */
function LegacyModuleSlug() {
  const { id } = useParams()
  return <Navigate to={`/library/module/${id}`} replace />
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
