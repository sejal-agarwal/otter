'use client'

import Image from 'next/image'
import Link from 'next/link'

export function Header() {
  return (
    <header className="w-full bg-jade-accent text-white shadow-md flex-shrink-0 z-30 border-b border-jade-accent">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex justify-between items-center">
        <div className="flex items-center space-x-3 select-none">
          <Image src="/otter.png" alt="Otter Logo" width={34} height={34} className="object-contain" priority />
          <span className="text-2xl font-normal tracking-wide text-white">Otter</span>
        </div>
        
        <Link 
          href="/logout" 
          className="font-bold text-white hover:underline underline-offset-4 decoration-2 text-sm transition"
        >
          Log out
        </Link>
      </div>
    </header>
  )
}