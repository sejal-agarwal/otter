'use client'

import Image from 'next/image'

interface LoadingOtterProps {
  message?: string
  className?: string
  size?: 'small' | 'normal'
}

export function LoadingOtter({ message, className = '', size = 'normal' }: LoadingOtterProps) {
  const isSmall = size === 'small'
  const containerSizes = isSmall ? 'w-6 h-6.5' : 'w-12 h-14'
  const imageSizes = isSmall ? 'w-5 h-5' : 'w-10 h-10'
  const waveSizes = isSmall ? 'w-6 h-1.5' : 'w-12 h-3'

  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      <div className={`flex flex-col items-center justify-end relative ${containerSizes}`}>
        <div className={`relative animate-swim bottom-[-1px] z-10 ${imageSizes}`}>
          <Image 
            src="/otter.png" 
            alt="Ollie" 
            fill 
            className="object-contain" 
            priority 
          />
        </div>
        
        <svg 
          className={`text-blue-400/70 relative z-0 ${waveSizes}`}
          viewBox="0 0 24 5" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth={1.5} 
          strokeLinecap="round"
        >
          <path className="animate-squiggle" d="M0 2.5 Q 3 0, 6 2.5 T 12 2.5 T 18 2.5 T 24 2.5" />
        </svg>
      </div>

      {message && (
        <span className={`tracking-wider opacity-80 animate-pulse ${isSmall ? 'pl-2 text-[10px] font-bold pt-1' : 'pt-3 text-xs font-bold'}`}>
          {message}
        </span>
      )}
    </div>
  )
}