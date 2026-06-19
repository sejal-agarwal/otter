import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { messages, incomingMessage, base64Image, isNewSession, cleanUserPrompt } = await req.json()

    if (!messages || !incomingMessage) {
      return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 })
    }

    const titleSourceText = cleanUserPrompt || incomingMessage.content

    let contextString = ""
    let citationReferences: Array<{ name: string; url: string }> = []

    try {
      // Step A: Convert the clean user prompt text string into vector coordinates
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: titleSourceText,
      })
      const [{ embedding: queryVector }] = embeddingResponse.data

      // Step B: Match against our Postgres pgvector chunks function
      const { data: matchedChunks, error: rpcError } = await supabaseAdmin.rpc(
        'match_course_chunks',
        {
          query_embedding: queryVector,
          match_threshold: 0.35, // Adjust similarity tolerances
          match_count: 5         // Feed top 5 chunks
        }
      )

      if (rpcError) throw rpcError

      if (matchedChunks && matchedChunks.length > 0) {
        const fileCitationsMap: Record<string, { url: string; pages: Set<number> }> = {}

        for (const chunk of matchedChunks) {
          const { data: material } = await supabaseAdmin
            .from('course_materials')
            .select('name, storage_path')
            .eq('id', chunk.material_id)
            .single()

          if (material) {
            contextString += `\n[Source File: ${material.name} | Page: ${chunk.page_number}]\nContent: ${chunk.content}\n`

            if (!fileCitationsMap[material.name]) {
              const { data: urlData } = supabaseAdmin.storage
                .from('course-knowledge-base')
                .getPublicUrl(material.storage_path)

              fileCitationsMap[material.name] = {
                url: urlData.publicUrl,
                pages: new Set<number>()
              }
            }
            fileCitationsMap[material.name].pages.add(chunk.page_number)
          }
        }

        citationReferences = Object.entries(fileCitationsMap).map(([name, meta]) => {
          const sortedPages = Array.from(meta.pages).sort((a, b) => a - b)
          return {
            name: `${name} (Pages: ${sortedPages.join(', ')})`,
            url: `${meta.url}#page=${sortedPages[0]}`
          }
        })
      }
    } catch (ragError) {
      console.error('RAG contextual matching pipeline anomaly:', ragError)
      // Non-blocking fallback: let the conversation loop proceed without crashing if embeddings fail
    }

    const formattedHistory = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }))

    const userContent: any[] = [{ type: 'text', text: incomingMessage.content }]
    if (base64Image) {
      userContent.push({ type: 'image_url', image_url: { url: base64Image } })
    }

const systemPrompt = {
  role: 'system',
  content: `You are Ollie the Otter, a helpful classroom teaching assistant.
  
  Answer the student's question accurately using ONLY the provided course reference context blocks underneath.
  
  STRICT INLINE LINK RULE: When you reference a fact from a file, you MUST immediately insert an inline link using this exact template format: [View: FileName.pdf | Page: X] (e.g., "...as discussed in the design introduction [View: Lecture_01_Introduction.pdf | Page: 3]"). Do not use standard markdown links or alternate phrasing.
  
  If the provided course documents do not contain the answer, politely tell the student that the information isn't in the uploaded materials yet.
  
  ---
  COURSE CONTEXT LOGS:
  ${contextString || "No master data embedded for this query topic yet."}`
}

    const apiMessages = [
      systemPrompt,
      ...formattedHistory,
      { role: 'user', content: userContent }
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: apiMessages,
      temperature: 0.2 // Lower temp locks down hallucinations and sticks directly to provided materials
    })
    const aiResponse = completion.choices[0]?.message?.content || "I couldn't process that response."

    let generatedTitle = null
    if (isNewSession) {
      try {
        const titleCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a chat session title generator. Analyze the user question and generate a brief, clear 3-5 word topic summary (e.g., "Heuristic Evaluation Principles" or "Next.js Folder Routing"). Do NOT use quotation marks, punctuation, markdown, or wrap it in a sentence. Return ONLY the title text.'
            },
            { role: 'user', content: titleSourceText }
          ],
          max_tokens: 15,
          temperature: 0.5
        })

        const rawTitle = titleCompletion.choices[0]?.message?.content?.trim()
        if (rawTitle && !rawTitle.toLowerCase().includes('sorry') && rawTitle.length > 2) {
          generatedTitle = rawTitle.replace(/["']/g, '') // strip quote injections
        }
      } catch (titleError) {
        console.error('Failed to generate title context:', titleError)
      }
    }

    return NextResponse.json({
      content: aiResponse,
      title: generatedTitle,
      citations: citationReferences.length > 0 ? citationReferences : null
    })

  } catch (error: any) {
    console.error('OpenAI backend error:', error)
    return NextResponse.json({ error: 'Failed to communicate with AI core.' }, { status: 500 })
  }
}