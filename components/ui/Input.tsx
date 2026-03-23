'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: string
  suffix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, suffix, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text mb-1.5">{label}</label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-4 text-muted font-medium text-sm select-none">{prefix}</span>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-bg border border-border rounded-2xl px-4 py-3.5
              text-text text-sm font-medium placeholder:text-muted/50
              focus:border-primary focus:ring-2 focus:ring-primary/10
              transition-all duration-200
              ${prefix ? 'pl-8' : ''}
              ${suffix ? 'pr-16' : ''}
              ${error ? 'border-danger focus:border-danger focus:ring-danger/10' : ''}
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <span className="absolute right-4 text-muted text-sm font-medium select-none">{suffix}</span>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-danger font-medium">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface SelectProps {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function Select({ label, error, options, value, onChange, placeholder }: SelectProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-text mb-1.5">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full bg-bg border border-border rounded-2xl px-4 py-3.5
          text-text text-sm font-medium appearance-none
          focus:border-primary focus:ring-2 focus:ring-primary/10
          transition-all duration-200
          ${error ? 'border-danger' : ''}
        `}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-danger font-medium">{error}</p>}
    </div>
  )
}
