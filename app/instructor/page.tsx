'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/Button'
import { Header } from '@/components/Header'
import { DashboardCard } from '@/components/DashboardCard'

export default function InstructorDashboard() {
  const supabase = createClient()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [instructorName, setInstructorName] = useState('')

  useEffect(() => {
    async function verifyInstructorAuth() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return router.push('/login')

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name, role')
          .eq('id', user.id)
          .single()

        if (profileError || profile?.role !== 'INSTRUCTOR') return router.push('/chat')

        setInstructorName(profile?.name || 'Instructor')
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to boot instructor panel:', err)
        router.push('/login')
      }
    }
    verifyInstructorAuth()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-sage-border font-abeezee text-forest-dark">
        <div className="text-sm font-bold tracking-wider animate-pulse">Loading secure instructor console...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-sage-border font-abeezee text-forest-dark flex flex-col overflow-hidden relative">
      <Header />

      <div className="flex-1 w-full flex flex-col justify-center items-center px-6 relative max-w-4xl mx-auto">
        
        <div className="absolute top-35 left-6 right-6 text-left select-none">
          <h1 className="text-3xl font-normal tracking-wide text-forest-dark">Welcome back, {instructorName}</h1>
          <p className="text-xs text-forest-dark/60 font-medium mt-1">Instructor Management Console</p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mt-16 animate-fade-in">
          
          <DashboardCard
            title="Upload Course Materials"
            description="Feed Ollie the system knowledge base. Upload course notes, slide decks, or syllabi to expand local RAG context parameters."
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            }
          >
            <Button idleLabel="Manage Materials" onClick={() => router.push('/instructor/upload')} />
          </DashboardCard>

          <DashboardCard
            title="Student Insights Dashboard"
            description="Analyze aggregated, fully anonymized student queries and topic clusters. Track confused concepts without compromising user identity metrics."
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          >
            <Button idleLabel="View Student Metrics" onClick={() => router.push('/instructor/dashboard')} />
          </DashboardCard>

        </div>
      </div>
    </div>
  )
}