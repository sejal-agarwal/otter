import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Initialize OpenAI safely
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
})

export async function GET() {
    try {
        // 1. Verify API Key exists
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                summary: "AI Summary is unavailable: Missing OPENAI_API_KEY in environment variables."
            })
        }

        // 2. Initialize Supabase with service role or public tokens
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ summary: "Database configuration missing." }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 3. Fetch past week's student questions from the view
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data: queries, error: dbError } = await supabase
            .from('student_queries_view')
            .select('content')
            .gte('created_at', sevenDaysAgo.toISOString())

        if (dbError) {
            console.error('Database Error:', dbError)
            return NextResponse.json({ summary: `Database error: ${dbError.message}` }, { status: 500 })
        }

        // 4. Graceful handling if there are no student queries yet
        if (!queries || queries.length === 0) {
            return NextResponse.json({
                summary: "No student queries have been recorded this week to summarize yet. Take a look at the metrics below!"
            })
        }

        // 5. Flatten queries for the LLM context
        const promptsCorpus = queries.map(q => `- ${q.content}`).join('\n')

        // 6. Request compilation from OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert academic data analyst. Analyze the following student questions. Provide a concise, professional summary containing exactly 3 distinct bullet points outlining the core concepts students are struggling with. CRITICAL: Use standard unicode bullet point symbols (•) to start each line instead of dashes or numbers.'
                },
                {
                    role: 'user',
                    content: `Summarize these student queries:\n${promptsCorpus}`
                }
            ],
            temperature: 0.3,
        })
        const aiSummary = completion.choices[0]?.message?.content || "Could not generate summary format."

        return NextResponse.json({ summary: aiSummary })

    } catch (err: any) {
        console.error('AI Summary Route Error:', err)
        return NextResponse.json({
            summary: `Failed to compile weekly analytics summary. Error: ${err.message || err}`
        }, { status: 200 }) // Return status 200 with error text to keep frontend from breaking
    }
}