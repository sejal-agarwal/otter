'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LogoutPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function handleAbsoluteSignOut() {
      try {
        await supabase.auth.signOut()
        localStorage.removeItem('otter_last_session_id')
      } catch (err) {
        console.error('Logout handler exception:', err)
      } finally {
        router.push('/login')
        router.refresh()
      }
    }
    handleAbsoluteSignOut()
  }, [router, supabase])

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-sage-border font-abeezee text-forest-dark">
      <div className="text-sm font-bold tracking-wider animate-pulse">
        Signing you out securely...
      </div>
    </div>
  )
}