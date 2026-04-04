// ModuleLayout — standardised layout variants for module content
// Variants: 3u (vertical), 1u (horizontal), 1u-stacked (1U with rows)

export default function ModuleLayout({ variant = '3u', children }) {
  const styles = {
    '3u': { display: 'flex', flexDirection: 'column', height: '100%', gap: 4 },
    '1u': { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 4 },
    '1u-stacked': { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 3 },
  }

  return <div style={styles[variant] || styles['3u']}>{children}</div>
}

export function ModuleControls({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
      {children}
    </div>
  )
}

export function ModuleRow({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
      {children}
    </div>
  )
}

export function ModuleJacks({ variant = 'row', children }) {
  return (
    <div style={{ flexShrink: 0, display: 'flex', flexDirection: variant === 'column' ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      {children}
    </div>
  )
}
