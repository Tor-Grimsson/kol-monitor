// Illustration loader — loads SVGs from ./svg/ by name

const svgModules = import.meta.glob('./svg/**/*.svg', { eager: true, query: '?raw', import: 'default' })

const CACHE = Object.entries(svgModules).reduce((acc, [path, svgContent]) => {
  const fileName = path.split('/').pop() || ''
  const name = fileName.replace('.svg', '')
  acc[name] = svgContent
  return acc
}, {})

export default function Illustration({ name, className = '', style = {} }) {
  const svg = CACHE[name]

  if (!svg) {
    console.warn(`Illustration "${name}" not found in walkthrough/svg/`)
    return null
  }

  const scaled = svg
    .replace(/width="[^"]*"/, 'width="100%"')
    .replace(/height="[^"]*"/, 'height="100%"')

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: '100%', height: '100%', lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: scaled }}
    />
  )
}
