// TextInput — styled text field shared across modules
// Matches the REC/filename input pattern. Optional onCommit fires on Enter or blur.

import { useState, useEffect, useCallback } from 'react'

export default function TextInput({
  value,
  onChange,
  onCommit,
  placeholder,
  className = 'kol-helper-xxxs',
  style,
  mono = true,
}) {
  // Local draft so commit-on-blur/Enter can differ from live onChange
  const [draft, setDraft] = useState(value ?? '')

  useEffect(() => { setDraft(value ?? '') }, [value])

  const commit = useCallback(() => {
    if (onCommit) onCommit(draft.trim())
  }, [draft, onCommit])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') { e.currentTarget.blur() }
    if (e.key === 'Escape') { setDraft(value ?? ''); e.currentTarget.blur() }
  }, [value])

  const handleChange = useCallback((e) => {
    setDraft(e.target.value)
    if (onChange) onChange(e.target.value)
  }, [onChange])

  return (
    <input
      type="text"
      value={onCommit ? draft : (value ?? '')}
      onChange={handleChange}
      onBlur={onCommit ? commit : undefined}
      onKeyDown={onCommit ? handleKeyDown : undefined}
      placeholder={placeholder}
      className={className}
      style={{
        flex: 1,
        background: 'var(--kol-surface-primary)',
        color: '#fff',
        border: 'none',
        borderRadius: 2,
        padding: '4px 8px',
        outline: 'none',
        minWidth: 0,
        fontFamily: mono ? 'var(--kol-font-family-mono)' : undefined,
        ...style,
      }}
    />
  )
}
