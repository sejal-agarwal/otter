'use client'

import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export function Header() {
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      // 1. Terminate session natively on Supabase
      await supabase.auth.signOut()
      
      // 2. Force a full window refresh to login to drop memory state
      window.location.href = '/login'
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <header className="w-full bg-jade-accent text-white shadow-md flex-shrink-0 z-30 border-b border-jade-accent">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex justify-between items-center">
        
        <Link 
          href="/" 
          className="flex items-center space-x-3 select-none cursor-pointer text-inherit hover:text-inherit no-underline"
        >
          <Image src="/otter.png" alt="Otter Logo" width={34} height={34} className="object-contain" priority />
          <span className="text-2xl font-normal tracking-wide text-white">Otter</span>
        </Link>
        
        <button 
          onClick={handleLogout}
          className="font-bold text-white hover:underline underline-offset-4 decoration-2 text-sm transition cursor-pointer bg-transparent border-none outline-none"
        >
          Log out
        </button>
      </div>
    </header>
  )
}