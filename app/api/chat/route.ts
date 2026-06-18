import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

export async function POST(req: Request) {
  try {
    const { messages, incomingMessage, base64Image, isNewSession, cleanUserPrompt } = await req.json()

    if (!messages || !incomingMessage) {
      return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 })
    }

    const formattedHistory = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }))

    const userContent: any[] = [{ type: 'text', text: incomingMessage.content }]
    if (base64Image) {
      userContent.push({ type: 'image_url', image_url: { url: base64Image } })
    }

    const apiMessages = [
      { role: 'system', content: "You are Ollie the Otter, a helpful classroom teaching assistant. Read all attached files or image context carefully to provide precise, accurate educational support." },
      ...formattedHistory,
      { role: 'user', content: userContent }
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: apiMessages,
    })
    const aiResponse = completion.choices[0]?.message?.content || "I couldn't process that response."

    // Handle auto-generating session titles
    let generatedTitle = null
    if (isNewSession) {
      try {
        const titleSourceText = cleanUserPrompt || incomingMessage.content

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
          generatedTitle = rawTitle.replace(/["']/g, '') // strip any accidental quote injections
        }
      } catch (titleError) {
        console.error('Failed to generate title context:', titleError)
      }
    }

    return NextResponse.json({ content: aiResponse, title: generatedTitle })
  } catch (error: any) {
    console.error('OpenAI backend error:', error)
    return NextResponse.json({ error: 'Failed to communicate with AI core.' }, { status: 500 })
  }
}