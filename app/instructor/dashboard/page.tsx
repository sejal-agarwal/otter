'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Header } from '@/components/Header'
import { LoadingOtter } from '@/components/LoadingOtter'

interface MetricState {
    totalQueries: number
    activeStudents: number
    avgQueriesPerStudent: number
    commonKeywords: { word: string; count: number }[]
    recentQueries: { id: string; content: string; created_at: string }[]
}

export default function StudentInsightsDashboard() {
    const supabase = createClient()
    const router = useRouter()

    const [isLoading, setIsLoading] = useState(true)
    const [metrics, setMetrics] = useState<MetricState>({
        totalQueries: 0,
        activeStudents: 0,
        avgQueriesPerStudent: 0,
        commonKeywords: [],
        recentQueries: []
    })

    const [aiSummary, setAiSummary] = useState<string>('')
    const [isAiLoading, setIsAiLoading] = useState<boolean>(true)

    useEffect(() => {
        async function fetchInsights() {
            try {
                // 1. Authenticate Instructor Session
                const { data: { user }, error: authError } = await supabase.auth.getUser()
                if (authError || !user) return router.push('/login')

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profileError || profile?.role !== 'INSTRUCTOR') return router.push('/chat')

                // 2. Query the scalable database view directly
                const { data: viewData, error: viewError } = await supabase
                    .from('student_queries_view')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (viewError) throw viewError

                const safeQueries = viewData || []

                // 3. Calculate Distinct Active Student Count
                const uniqueStudents = new Set(safeQueries.map(q => q.student_id)).size

                // 4. Calculate Average Queries per Student
                const avgQueriesPerStudent = safeQueries.length > 0
                    ? parseFloat((safeQueries.length / uniqueStudents).toFixed(1))
                    : 0;

                // 5. Client-side NLP keyword frequency mapping (ignoring common stop words)
                const stopWords = new Set(['what', 'is', 'the', 'how', 'to', 'a', 'an', 'and', 'for', 'in', 'of', 'on', 'with', 'my', 'can', 'you', 'i', 'this', 'that'])
                const wordCounts: Record<string, number> = {}

                safeQueries.forEach(query => {
                    const words = query.content.toLowerCase().replace(/[^a-zA-Z\s]/g, '').split(/\s+/)
                    words.forEach((word: string) => {
                        if (word.length > 2 && !stopWords.has(word)) {
                            wordCounts[word] = (wordCounts[word] || 0) + 1
                        }
                    })
                })

                const sortedKeywords = Object.entries(wordCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([word, count]) => ({ word, count }))

                // Map data safely to State structure
                setMetrics({
                    totalQueries: safeQueries.length,
                    activeStudents: uniqueStudents,
                    avgQueriesPerStudent: avgQueriesPerStudent,
                    commonKeywords: sortedKeywords,
                    recentQueries: safeQueries.slice(0, 10).map(q => ({
                        id: q.message_id,
                        content: q.content,
                        created_at: q.created_at
                    }))
                })

                setIsLoading(false)
            } catch (err) {
                console.error('Metrics aggregation failure:', err)
                setIsLoading(false)
            }
        }

        fetchInsights()
    }, [router, supabase])

    useEffect(() => {
        async function getAiSummary() {
            try {
                const res = await fetch('/api/instructor/summary')
                const data = await res.json()
                setAiSummary(data.summary || 'No summary available.')
            } catch (err) {
                console.error('Failed to load AI summary:', err)
                setAiSummary('Failed to compile weekly analytics summary.')
            } finally {
                setIsAiLoading(false)
            }
        }
        getAiSummary()
    }, [])

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-sage-border font-abeezee text-forest-dark">
                <div className="text-sm font-bold tracking-wider animate-pulse">Aggregating student interactions...</div>
            </div>
        )
    }

    return (
        <div className="h-screen w-screen bg-sage-border font-abeezee text-forest-dark flex flex-col overflow-hidden relative">
            <Header />

            <div className="flex-1 w-full flex flex-col px-6 max-w-6xl mx-auto overflow-y-auto pb-10">

                {/* Top Header Row */}
                <div className="w-full flex items-center justify-between pt-8 pb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-normal tracking-wide text-forest-dark">
                            Student Insights
                        </h1>
                        <p className="text-xs text-forest-dark/60 font-medium mt-1">
                            Anonymized data analytics for curriculum optimization
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/instructor')}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-dark/80 hover:text-forest-dark transition-colors border border-forest-dark/20 px-3 py-2 rounded-lg bg-pebble-light/30"
                    >
                        ← Back to Console
                    </button>
                </div>

                {/* --- METRICS CARDS ROW --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-pebble-light/40 border border-sage-border backdrop-blur-xs p-6 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group">
                        <span className="text-xs font-bold tracking-wider uppercase text-forest-dark/60">Total Student Queries</span>
                        <span className="text-4xl font-normal text-forest-dark mt-4 group-hover:scale-105 transition-transform origin-left block">
                            {metrics.totalQueries}
                        </span>
                    </div>

                    <div className="bg-pebble-light/40 border border-sage-border backdrop-blur-xs p-6 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group">
                        <span className="text-xs font-bold tracking-wider uppercase text-forest-dark/60">Active Student Users</span>
                        <span className="text-4xl font-normal text-forest-dark mt-4 group-hover:scale-105 transition-transform origin-left block">
                            {metrics.activeStudents}
                        </span>
                    </div>

                    <div className="bg-pebble-light/40 border border-sage-border backdrop-blur-xs p-6 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group">
                        <span className="text-xs font-bold tracking-wider uppercase text-forest-dark/60">Avg. Queries / Student</span>
                        <span className="text-4xl font-normal text-forest-dark mt-4 group-hover:scale-105 transition-transform origin-left block">
                            {metrics.avgQueriesPerStudent}
                        </span>
                    </div>
                </div>

                {/* --- LOWER DETAILS ROW --- */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">

                    {/* --- AI weekly summary container --- */}
                    <div className="w-full md:col-span-5 bg-forest-dark text-pebble-light p-6 rounded-2xl mb-2 border border-forest-dark/20 shadow-md relative">
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-sm font-bold uppercase tracking-wider opacity-90">Summary of Student Queries</h2>
                            <span className="bg-jade-accent text-forest-dark text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                                AI Insights
                            </span>
                        </div>

                        {isAiLoading ? (
                            <div className="py-6 flex items-center justify-center">
                                <LoadingOtter
                                    size="normal"
                                    message="Ollie is summarizing student queries from the past week..."
                                    className="text-pebble-light"
                                />
                            </div>
                        ) : (
                            <div className="text-xs md:text-sm leading-relaxed opacity-90 font-light whitespace-pre-line space-y-1">
                                {aiSummary}
                            </div>
                        )}
                    </div>

                    {/* Left Side: Keywords Distribution */}
                    <div className="md:col-span-2 bg-pebble-light/30 border border-sage-border/60 rounded-2xl p-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-forest-dark/80 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4 animate-swim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Common Query Keywords
                        </h3>
                        <div className="space-y-3">
                            {metrics.commonKeywords.length === 0 ? (
                                <p className="text-xs text-forest-dark/50 italic">Insufficient interaction data to cluster topics.</p>
                            ) : (
                                metrics.commonKeywords.map((item, idx) => (
                                    <div key={idx} className="flex flex-col">
                                        <div className="flex justify-between text-xs font-medium mb-1 px-1">
                                            <span className="text-forest-dark font-mono">#{item.word}</span>
                                            <span className="text-forest-dark/60">{item.count} hits</span>
                                        </div>
                                        <div className="w-full bg-forest-dark/10 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-jade-accent h-full rounded-full transition-all duration-500"
                                                style={{ width: `${(item.count / metrics.totalQueries) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Side: Sample Prompts Stream */}
                    <div className="md:col-span-3 bg-pebble-light/30 border border-sage-border/60 rounded-2xl p-6 flex flex-col max-h-[420px]">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-forest-dark/80 mb-4">
                            Live Prompt Feed (Anonymized)
                        </h3>
                        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                            {metrics.recentQueries.length === 0 ? (
                                <p className="text-xs text-forest-dark/50 italic py-4 text-center">No student queries have been generated yet.</p>
                            ) : (
                                metrics.recentQueries.map((query) => (
                                    <div
                                        key={query.id}
                                        className="p-3 bg-pebble-light/60 border border-sage-border rounded-xl flex flex-col justify-between gap-2 hover:bg-pebble-light transition-colors"
                                    >
                                        <p className="text-xs text-forest-dark font-normal leading-relaxed break-words">
                                            &ldquo;{query.content}&rdquo;
                                        </p>
                                        <span className="text-[10px] text-slate-mist font-semibold self-end">
                                            {new Date(query.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    )
}