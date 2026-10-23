// The Dev page's tabs — kol-shell's `HubDev` draws the page (AppStudio `dev={{ tabs }}`, kol-shell 0.65.0,
// ticket CompareGridDevTab): `/dev`, the `code` rail row, a dev server only. This file is only the content.
// Each tab is lazy, and the whole list is null outside a dev server, so production never bundles it.
import { lazy, Suspense } from 'react'

const tab = (value, label, load) => {
  const Comp = lazy(load)
  return { value, label, content: <Suspense fallback={null}><Comp /></Suspense> }
}

export const DEV_TABS = import.meta.env.DEV ? [
  tab('tabs', 'Tabs', () => import('./dev/TabStyles.jsx')),
  tab('color-picker', 'Color picker', () => import('./dev/ColorPickerPage.jsx')),
  tab('controls', 'Controls A/B', () => import('./dev/ControlsAbPage.jsx')),
  tab('modules', 'Module design', () => import('./dev/ModuleDesignPage.jsx')),
  tab('app-card', 'App card', () => import('./dev/AppCardPage.jsx')),
] : null
