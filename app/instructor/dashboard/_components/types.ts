export interface GroupUsage {
    groupName: string
    totalGroupQueries: number
    studentBreakdown: { studentIdAnon: string; count: number; percentage: number }[]
    isUneven: boolean
    timeline: { date: string; memberCounts: Record<string, number> }[]
}

export interface UploadMetrics {
    totalUploads: number
    studentsWhoUploaded: number
    imageCount: number
    pdfCount: number
}

export interface MetricState {
    totalQueries: number
    activeStudents: number
    avgQueriesPerStudent: number
    avgPromptWordCount: number
    commonKeywords: { word: string; count: number }[]
    groupMetrics: GroupUsage[]
    uploadMetrics: UploadMetrics
    dailyUsage: { date: string; count: number }[]
}
