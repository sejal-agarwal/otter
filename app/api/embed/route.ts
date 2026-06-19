import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const pdfParse = require('pdf-parse-fork')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function chunkTextWithOverlap(text: string, chunkSize = 800, overlap = 150): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let i = 0

  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSize)
    chunks.push(chunkWords.join(' '))
    i += chunkSize - overlap
  }
  return chunks
}

export async function POST(req: Request) {
  try {
    const { materialId, storagePath } = await req.json()

    if (!materialId || !storagePath) {
      return NextResponse.json({ error: 'Missing core material identifiers.' }, { status: 400 })
    }

    const { data: fileBuffer, error: downloadErr } = await supabaseAdmin.storage
      .from('course-knowledge-base')
      .download(storagePath)

    if (downloadErr || !fileBuffer) {
      console.error('Supabase extraction error:', downloadErr)
      return NextResponse.json({ error: 'Failed to download file from storage bucket.' }, { status: 500 })
    }

    const arrayBuffer = await fileBuffer.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let textByPage: string[] = []

    if (storagePath.toLowerCase().endsWith('.pdf')) {
      await pdfParse(buffer, {
        pagerender: (pageData: any) => {
          return pageData.getTextContent().then((textContent: any) => {
            const pageText = textContent.items.map((item: any) => item.str).join(' ')
            textByPage.push(pageText)
            return pageText
          })
        }
      })
    } else {
      textByPage.push(buffer.toString('utf-8'))
    }

    let totalChunksSaved = 0
    
    for (let pageIdx = 0; pageIdx < textByPage.length; pageIdx++) {
      const pageText = textByPage[pageIdx]
      const pageNumber = pageIdx + 1

      if (!pageText.trim()) continue

      const textChunks = chunkTextWithOverlap(pageText, 500, 100)

      for (const chunk of textChunks) {
        if (!chunk.trim()) continue

        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunk,
        })
        const [{ embedding: vectorCoords }] = embeddingResponse.data

        const { error: insertErr } = await supabaseAdmin
          .from('course_material_chunks')
          .insert({
            material_id: materialId,
            content: chunk,
            page_number: pageNumber,
            embedding: vectorCoords
          })

        if (insertErr) throw insertErr
        totalChunksSaved++
      }
    }

    return NextResponse.json({ success: true, pagesProcessed: textByPage.length, chunksSaved: totalChunksSaved })
  } catch (error: any) {
    console.error('Vector background processing failure exception:', error)
    return NextResponse.json({ error: error.message || 'Embedding generation error.' }, { status: 500 })
  }
}