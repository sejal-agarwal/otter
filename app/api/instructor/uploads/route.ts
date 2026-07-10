import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Database configuration missing.' }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Get all student session IDs via the view (already scoped to students)
        const { data: queryData, error: viewError } = await supabase
            .from('student_queries_view')
            .select('session_id, student_id')

        if (viewError) throw viewError

        const rows = queryData || []
        if (rows.length === 0) {
            return NextResponse.json({ totalUploads: 0, studentsWhoUploaded: 0, imageCount: 0, pdfCount: 0 })
        }

        // Build session → student mapping
        const sessionToStudent: Record<string, string> = {}
        rows.forEach(r => { sessionToStudent[r.session_id] = r.student_id })
        const sessionIds = Object.keys(sessionToStudent)

        // Query messages with non-null citations using service role (bypasses RLS)
        const { data: uploadMessages, error: msgError } = await supabase
            .from('messages')
            .select('citations, session_id')
            .in('session_id', sessionIds)
            .eq('role', 'user')
            .not('citations', 'is', null)

        if (msgError) throw msgError

        const studentsWithUploads = new Set<string>()
        let imageCount = 0
        let pdfCount = 0
        let totalUploads = 0

        ;(uploadMessages || []).forEach(msg => {
            const citations = msg.citations as Array<{ name: string; url: string; type?: string }> | null
            if (!citations) return
            const studentId = sessionToStudent[msg.session_id]
            if (studentId) studentsWithUploads.add(studentId)
            citations.forEach(file => {
                if (!file.type) return
                totalUploads++
                if (file.type.startsWith('image/')) imageCount++
                else if (file.type === 'application/pdf') pdfCount++
            })
        })

        return NextResponse.json({
            totalUploads,
            studentsWhoUploaded: studentsWithUploads.size,
            imageCount,
            pdfCount
        })

    } catch (err: unknown) {
        console.error('Upload metrics route error:', err)
        return NextResponse.json({ totalUploads: 0, studentsWhoUploaded: 0, imageCount: 0, pdfCount: 0 }, { status: 500 })
    }
}
