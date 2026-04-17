import React from 'react'
import Icon from '../../icons/Icon'

const SIZE_MAP = {
  sm: { icon: 14, paddingX: 16 },
  md: { icon: 14, paddingX: 20 },
  lg: { icon: 18, paddingX: 24 }
}

const Input = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  size = 'md',
  uppercase = false,
  iconLeft,
  iconSize = null,
  className = '',
  style = {},
  ...props
}) => {
  const metrics = SIZE_MAP[size] || SIZE_MAP.md
  const sizeClass =
    size === 'sm'
      ? 'input-sm'
      : size === 'lg'
      ? 'input-lg'
      : 'input-md'
  const caseClass = uppercase ? 'uppercase' : ''

  const combinedClass = `input-outline ${sizeClass} ${caseClass} ${className}`.trim()

  const resolvedIconSize = iconLeft ? (iconSize ?? metrics.icon) : null

  const inlineStyle = { ...style }

  if (iconLeft && resolvedIconSize) {
    inlineStyle.paddingLeft = metrics.paddingX + resolvedIconSize + 12
  }

  return (
    <div className="relative inline-flex w-full items-center">
      {iconLeft && (
        <span
          className="absolute flex items-center text-auto opacity-50 pointer-events-none"
          style={{
            left: `${metrics.paddingX}px`,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <Icon name={iconLeft} size={resolvedIconSize ?? 14} />
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={combinedClass}
        style={inlineStyle}
        {...props}
      />
    </div>
  )
}

export default Input
