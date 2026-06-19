import { useRouter } from 'next/navigation'
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

export function ReturnToInstructorConsoleButton({ }: {}) {
  const router = useRouter()
  return (
    <div className="absolute top-4 left-0 right-0 z-20 flex justify-center select-none pointer-events-none">
      <button
        onClick={() => router.push('/instructor')}
        className="pointer-events-auto text-xs font-bold bg-jade-accent text-white px-4 py-2 rounded-full shadow-md hover:bg-forest-dark border border-white/10 flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
        <span>Return to Instructor Console</span>
      </button>
    </div>
  )
}