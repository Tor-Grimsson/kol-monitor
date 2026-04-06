import Icon from '../icons/Icon'
import Input from './Input'

/**
 * SearchInput — search field wrapping Input with a search icon.
 * Shares Input's size system (sm/md/lg, default md).
 *
 * iconOnly — renders a plain icon button instead of the full input.
 * bare — renders a borderless inline search (used in overlays).
 */
const SearchInput = ({ value, onChange, placeholder = 'Search…', size, className = '', iconOnly = false, bare = false, onClick, ...rest }) => {
  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Search"
        className="flex h-9 w-9 items-center justify-center rounded-md text-fg-64 transition-colors hover:bg-fg-08 hover:text-fg"
      >
        <Icon name="search" size={18} />
      </button>
    )
  }

  if (bare) {
    return (
      <div
        className={className}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', width: '100%' }}
      >
        <span style={{ color: 'color-mix(in srgb, var(--kol-surface-on-primary) 48%, transparent)', display: 'flex', flexShrink: 0 }}>
          <Icon name="search" size={16} />
        </span>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: 'var(--kol-font-family-mono)',
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '0.05em',
            color: 'inherit',
            background: 'transparent',
            border: 'none',
            outline: 'none',
          }}
          {...rest}
        />
      </div>
    )
  }

  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      size={size}
      iconLeft="search"
      className={className}
      {...rest}
    />
  )
}

export default SearchInput
