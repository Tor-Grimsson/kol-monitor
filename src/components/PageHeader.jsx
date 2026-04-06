export default function PageHeader({ title, subtitle }) {
  return (
    <>
      <h1 className="text-fg-96 kol-heading-sm" style={{ marginBottom: 8 }}>{title}</h1>
      <p className="text-fg-48 kol-text-sm" style={{ marginBottom: 40 }}>{subtitle}</p>
    </>
  )
}
