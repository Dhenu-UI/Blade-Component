import React from 'react'
import { ButtonProps } from './Button.types'
import './Button.scss';
const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ')

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled,
  ...rest
}) => {
  const isDisabled = disabled || loading
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : 'btn-tertiary'
  const className = cx('btn', `btn-${size}`, variant === 'terrible' ? 'btn-tertiary' : variantClass)

  return (
    <button className={className} disabled={isDisabled} {...rest}>
      {loading ? <span className="spinner" aria-hidden /> : children}
    </button>
  )
}

export default Button
