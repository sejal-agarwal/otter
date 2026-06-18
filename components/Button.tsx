import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  idleLabel: string
  pendingLabel?: string
  isPending?: boolean
}

export function Button({ 
  idleLabel, 
  pendingLabel = 'Processing...', 
  isPending = false, 
  disabled,
  className = '',
  type = 'button',
  ...props 
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || isPending}
      className={`w-full rounded-2xl bg-forest-dark py-4 text-sm font-bold text-white transition duration-200 hover:opacity-85 active:scale-[0.98] shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {isPending ? pendingLabel : idleLabel}
    </button>
  )
}