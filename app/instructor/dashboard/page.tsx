'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Header } from '@/components/Header'
import { MetricState, GroupUsage, UploadMetrics } from './_components/types'
import { MetricsGrid } from './_components/MetricsGrid'
import { AiSummaryCard } from './_components/AiSummaryCard'
import { KeywordsCard } from './_components/KeywordsCard'
import { GroupUsageCard } from './_components/GroupUsageCard'
import { UploadMetricsCard } from './_components/UploadMetricsCard'
import { UsageTimeline } from './_components/UsageTimeline'


function getLast20Days(): string[] {
    return Array.from({ length: 20 }, (_, i) => {
        const d = new Date()
        d.setUTCDate(d.getUTCDate() - (19 - i))
        return d.toISOString().split('T')[0]
    })
}

export default function StudentInsightsDashboard() {
    const supabase = createClient()
    const router = useRouter()

    const [isLoading, setIsLoading] = useState(true)
    const [metrics, setMetrics] = useState<MetricState>({
        totalQueries: 0,
        activeStudents: 0,
        avgQueriesPerStudent: 0,
        avgPromptWordCount: 0,
        commonKeywords: [],
        groupMetrics: [],
        uploadMetrics: { totalUploads: 0, studentsWhoUploaded: 0, imageCount: 0, pdfCount: 0 },
        dailyUsage: []
    })

    const [aiSummary, setAiSummary] = useState<string>('')
    const [isAiLoading, setIsAiLoading] = useState<boolean>(true)

    useEffect(() => {
        async function fetchInsights() {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser()
                if (authError || !user) return router.push('/login')

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profileError || profile?.role !== 'INSTRUCTOR') return router.push('/chat')

                const { data, error: viewError } = await supabase
                    .from('student_queries_view')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (viewError) throw viewError

                const viewData = data as Array<{
                    message_id: string;
                    content: string;
                    created_at: string;
                    session_id: string;
                    student_id: string;
                    group_id: string | null;
                    group_name: string | null;
                }> | null;

                const safeQueries = viewData || []
                const uniqueStudents = new Set(safeQueries.map(q => q.student_id)).size

                const avgQueriesPerStudent = safeQueries.length > 0
                    ? parseFloat((safeQueries.length / uniqueStudents).toFixed(1))
                    : 0;

                const stopWords = new Set(['what', 'is', 'the', 'how', 'to', 'a', 'an', 'and', 'for', 'in', 'of', 'on', 'with', 'my', 'can', 'you', 'i', 'this', 'that', 'are', 'most'])
                const wordCounts: Record<string, number> = {}
                let totalWordsAccumulator = 0
                const groupsMap: Record<string, Record<string, number>> = {}
                const groupTimelineMap: Record<string, Record<string, Record<string, number>>> = {}
                const dailyCountMap: Record<string, number> = {}

                safeQueries.forEach(query => {
                    const rawWords = query.content.trim().split(/\s+/)
                    if (query.content.trim().length > 0) {
                        totalWordsAccumulator += rawWords.length
                    }

                    const cleanWords = query.content.toLowerCase().replace(/[^a-zA-Z\s]/g, '').split(/\s+/)
                    cleanWords.forEach((word: string) => {
                        if (word.length > 2 && !stopWords.has(word)) {
                            wordCounts[word] = (wordCounts[word] || 0) + 1
                        }
                    })

                    const date = new Date(query.created_at).toISOString().split('T')[0]
                    dailyCountMap[date] = (dailyCountMap[date] || 0) + 1

                    if (query.group_id && query.group_name) {
                        if (!groupsMap[query.group_name]) groupsMap[query.group_name] = {}
                        groupsMap[query.group_name][query.student_id] = (groupsMap[query.group_name][query.student_id] || 0) + 1

                        if (!groupTimelineMap[query.group_name]) groupTimelineMap[query.group_name] = {}
                        if (!groupTimelineMap[query.group_name][date]) groupTimelineMap[query.group_name][date] = {}
                        groupTimelineMap[query.group_name][date][query.student_id] = (groupTimelineMap[query.group_name][date][query.student_id] || 0) + 1
                    }
                })

                const last20Days = getLast20Days()
                const formattedGroupMetrics: GroupUsage[] = Object.entries(groupsMap).map(([groupName, studentsObj]) => {
                    const studentEntries = Object.entries(studentsObj)
                    const totalGroupQueries = studentEntries.reduce((sum, [_, count]) => sum + count, 0)

                    const sortedEntries = [...studentEntries].sort((a, b) => b[1] - a[1])
                    const studentIdToMember: Record<string, string> = {}

                    let isUneven = false
                    const studentBreakdown = sortedEntries.map(([studentId, count], idx) => {
                        const memberName = `Member ${idx + 1}`
                        studentIdToMember[studentId] = memberName
                        const percentage = totalGroupQueries > 0 ? Math.round((count / totalGroupQueries) * 100) : 0
                        if (percentage >= 70) isUneven = true
                        return { studentIdAnon: memberName, count, percentage }
                    })

                    const timeline = last20Days.map((date: string) => {
                        const dayData = groupTimelineMap[groupName]?.[date] || {}
                        const memberCounts: Record<string, number> = {}
                        Object.entries(dayData).forEach(([studentId, count]) => {
                            const member = studentIdToMember[studentId]
                            if (member) memberCounts[member] = count
                        })
                        return { date, memberCounts }
                    })

                    return { groupName, totalGroupQueries, studentBreakdown, isUneven, timeline }
                })

                const today = new Date().toISOString().split('T')[0]
                const allQueryDates = Object.keys(dailyCountMap)
                const firstDate = allQueryDates.length > 0
                    ? allQueryDates.reduce((min: string, d: string) => d < min ? d : min)
                    : today

                // Start one day before the first query for visual breathing room
                const dailyUsage: { date: string; count: number }[] = []
                const cursor = new Date(firstDate + 'T00:00:00.000Z')
                cursor.setUTCDate(cursor.getUTCDate() - 1)
                const endDate = new Date(today + 'T00:00:00.000Z')
                while (cursor <= endDate) {
                    const dateStr = cursor.toISOString().split('T')[0]
                    dailyUsage.push({ date: dateStr, count: dailyCountMap[dateStr] || 0 })
                    cursor.setUTCDate(cursor.getUTCDate() + 1)
                }

                const avgPromptWordCount = safeQueries.length > 0
                    ? Math.round(totalWordsAccumulator / safeQueries.length)
                    : 0

                const sortedKeywords = Object.entries(wordCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([word, count]) => ({ word, count }))

                // Upload metrics are fetched via API route because the messages table
                // is RLS-protected — instructors can only read their own rows client-side.
                // The API route uses the service role key to read all student messages.
                let uploadMetrics: UploadMetrics = { totalUploads: 0, studentsWhoUploaded: 0, imageCount: 0, pdfCount: 0 }
                try {
                    const uploadRes = await fetch('/api/instructor/uploads')
                    if (uploadRes.ok) uploadMetrics = await uploadRes.json()
                } catch (uploadErr) {
                    console.error('Failed to fetch upload metrics:', uploadErr)
                }

                setMetrics({
                    totalQueries: safeQueries.length,
                    activeStudents: uniqueStudents,
                    avgQueriesPerStudent,
                    avgPromptWordCount,
                    commonKeywords: sortedKeywords,
                    groupMetrics: formattedGroupMetrics,
                    uploadMetrics,
                    dailyUsage
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
        <div className="h-screen w-screen bg-sage-border font-abeezee text-forest-dark flex flex-col overflow-y-auto relative">
            <Header />

            {/* Mobile fixed back button */}
            <div className="md:hidden fixed top-16 left-0 right-0 z-30 flex justify-center bg-sage-border/90 backdrop-blur-md py-3 px-4 border-b border-forest-dark/10 shadow-xs">
                <button
                    onClick={() => router.push('/instructor')}
                    className="w-full text-center text-xs font-bold bg-jade-accent text-white px-4 py-2.5 rounded-full shadow-sm hover:bg-forest-dark border border-white/10 flex items-center justify-center space-x-1.5 transition active:scale-95 cursor-pointer"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                    <span>Return to Instructor Console</span>
                </button>
            </div>

            <div className="w-full flex flex-col px-6 max-w-6xl mx-auto pb-10 pt-16 md:pt-4">

                {/* Page header row */}
                <div className="w-full flex flex-row items-center justify-between pt-8 pb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-normal tracking-wide text-forest-dark">
                            Student Insights
                        </h1>
                        <p className="text-xs text-forest-dark/60 font-medium mt-1">
                            Anonymized data analytics for your classroom.
                        </p>
                    </div>

                    <div className="hidden md:block">
                        <button
                            onClick={() => router.push('/instructor')}
                            className="text-xs font-bold bg-jade-accent text-white px-4 py-2.5 rounded-full shadow-md hover:bg-forest-dark border border-white/10 flex items-center space-x-1.5 transition active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                            <span>Return to Instructor Console</span>
                        </button>
                    </div>
                </div>

                <MetricsGrid metrics={metrics} />

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
                    <AiSummaryCard summary={aiSummary} isLoading={isAiLoading} />
                    <UploadMetricsCard uploadMetrics={metrics.uploadMetrics} />
                    <UsageTimeline dailyUsage={metrics.dailyUsage} />
                    <KeywordsCard keywords={metrics.commonKeywords} totalQueries={metrics.totalQueries} />
                    <GroupUsageCard groupMetrics={metrics.groupMetrics} />
                </div>

            </div>
        </div>
    )
}
