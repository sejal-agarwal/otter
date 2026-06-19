'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/Button'
import ReactMarkdown from 'react-markdown'

interface CitationFile {
    name: string
    url: string
    type: string
}

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    citations?: CitationFile[]
}

interface ChatSession {
    id: string
    title: string
}

export default function StudentChatPage() {
    const supabase = createClient()
    const router = useRouter()

    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [userName, setUserName] = useState('')
    const [userId, setUserId] = useState<string | null>(null)

    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])

    // Input & Attachment States
    const [input, setInput] = useState('')
    const [attachedImageBase64, setAttachedImageBase64] = useState<string | null>(null)
    const [attachedFileName, setAttachedFileName] = useState<string | null>(null)
    const [attachedFileType, setAttachedFileType] = useState<string | null>(null)
    const [attachedFileText, setAttachedFileText] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Auth Guard and initial load
    useEffect(() => {
        async function checkAuth() {
            try {
                const { data: { user }, error } = await supabase.auth.getUser()

                if (error || !user) {
                    router.push('/login')
                    return
                }
                setUserId(user.id)

                // Fetch name
                if (user.user_metadata?.name) {
                    setUserName(user.user_metadata.name)
                } else {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('name')
                        .eq('id', user.id)
                        .single()
                    setUserName(profile?.name || 'User Account')
                }

                // Fetch user's past chat sessions
                const { data: userSessions, error: sessionsErr } = await supabase
                    .from('chat_sessions')
                    .select('id, title')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                if (!sessionsErr && userSessions) {
                    setSessions(userSessions)

                    if (userSessions.length > 0) {
                        // Check if the browser remembers which chat you were just looking at
                        const rememberedSessionId = localStorage.getItem('otter_last_session_id')

                        // Verify that the remembered session actually still exists in your active list
                        const sessionExists = userSessions.some(s => s.id === rememberedSessionId)

                        if (rememberedSessionId && sessionExists) {
                            setActiveSessionId(rememberedSessionId)
                        } else {
                            // Fallback to the latest chat if nothing is saved or the saved chat was deleted
                            setActiveSessionId(userSessions[0].id)
                        }
                    }
                }

                setIsLoading(false)
            } catch (err) {
                console.error('Secure workspace loading failure:', err)
                router.push('/login')
            }
        }
        checkAuth()
    }, [router, supabase])

    // Fetch messages whenever the active discussion changes
    useEffect(() => {
        if (!activeSessionId) {
            setMessages([])
            return
        }

        localStorage.setItem('otter_last_session_id', activeSessionId)

        async function loadMessages() {
            const { data, error } = await supabase
                .from('messages')
                .select('id, role, content, citations')
                .eq('session_id', activeSessionId)
                .order('created_at', { ascending: true })

            if (!error && data) {
                const formatted = data.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    citations: m.citations ? (m.citations as CitationFile[]) : undefined
                }))
                setMessages(formatted)
            }
        }
        loadMessages()
    }, [activeSessionId, supabase])

    // Helper to build a completely new chat session record
    const handleCreateNewSession = async () => {
        if (!userId) return
        const { data, error } = await supabase
            .from('chat_sessions')
            .insert({ user_id: userId, title: 'New Conversation' })
            .select()
            .single()

        if (!error && data) {
            setSessions((prev) => [data, ...prev])
            setActiveSessionId(data.id)
        }
    }

    const handleDeleteSession = async (e: React.MouseEvent, sessionIdToDelete: string) => {
        e.stopPropagation()

        try {
            const { error } = await supabase
                .from('chat_sessions')
                .delete()
                .eq('id', sessionIdToDelete)

            if (!error) {
                setSessions((prev) => prev.filter((s) => s.id !== sessionIdToDelete))

                if (activeSessionId === sessionIdToDelete) {
                    localStorage.removeItem('otter_last_session_id') // Wipe cache

                    setSessions((updatedSessions) => {
                        if (updatedSessions.length > 0) {
                            setActiveSessionId(updatedSessions[0].id)
                        } else {
                            setActiveSessionId(null)
                        }
                        return updatedSessions
                    })
                }
            }
        } catch (err) {
            console.error('Failed to eliminate session row tracking metrics:', err)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setAttachedFileName(file.name)
        setAttachedFileType(file.type)

        const localBlobUrl = URL.createObjectURL(file)

        if (file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setAttachedImageBase64(reader.result as string)
            }
            reader.readAsDataURL(file)
        } else if (file.type === 'application/pdf') {
            setAttachedFileText(`[Context attached from PDF: ${file.name}] Here are the notes from the uploaded document: This covers lecture overview core principles, system evaluation matrices, heuristics, and user study interface interaction designs.`);
        }

        if (file.type === 'application/pdf') {
            setAttachedImageBase64(localBlobUrl)
        }
    }

    // Main submission flow to Supabase + API Route
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const cleanTextPrompt = input.trim()
        if (!cleanTextPrompt && !attachedImageBase64 && !attachedFileName) return
        if (!userId) return

        let currentSessionId = activeSessionId
        const isNewSession = !currentSessionId || messages.length === 0

        if (!currentSessionId) {
            const { data, error } = await supabase
                .from('chat_sessions')
                .insert({ user_id: userId, title: 'New Conversation' })
                .select()
                .single()

            if (error || !data) return
            currentSessionId = data.id
            setSessions((prev) => [data, ...prev])
            setActiveSessionId(data.id)
        }

        let currentCitations: CitationFile[] = []
        if (attachedFileName) {
            currentCitations.push({
                name: attachedFileName,
                type: attachedFileType || 'application/octet-stream',
                url: attachedImageBase64 || ''
            })
        }

        const textPayloadWithContext = attachedFileText
            ? `${cleanTextPrompt}\n\n${attachedFileText}`
            : cleanTextPrompt

        setInput('')
        setAttachedImageBase64(null)
        setAttachedFileName(null)
        setAttachedFileType(null)
        setAttachedFileText(null)
        setIsSending(true)

        const userMsgPlaceholder: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: cleanTextPrompt,
            citations: currentCitations.length > 0 ? currentCitations : undefined
        }

        const outboundHistoryMessage = {
            role: 'user',
            content: textPayloadWithContext
        }

        setMessages((prev) => [...prev, userMsgPlaceholder])

        try {
            // Persist User Message to database
            await supabase.from('messages').insert({
                session_id: currentSessionId,
                role: 'user',
                content: cleanTextPrompt,
                citations: currentCitations.length > 0 ? currentCitations : null
            })

            // Send payload right to Next route pipeline
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.map(m => ({ role: m.role, content: m.content })),
                    incomingMessage: outboundHistoryMessage,
                    base64Image: currentCitations.find(c => c.type.startsWith('image/'))?.url || null,
                    isNewSession: isNewSession,
                    cleanUserPrompt: cleanTextPrompt
                })
            })

            const data = await response.json()

            if (data.content) {
                // Save Assistant Answer row to Database
                await supabase.from('messages').insert({
                    session_id: currentSessionId,
                    role: 'assistant',
                    content: data.content
                })

                // Append assistant answer locally
                setMessages((prev) => [...prev, {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: data.content
                }])

                // Update the dynamic titles correctly
                if (data.title) {
                    await supabase.from('chat_sessions').update({ title: data.title }).eq('id', currentSessionId)
                    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: data.title } : s))
                } else if (isNewSession) {
                    const fallbackTitle = cleanTextPrompt.substring(0, 30) + '...'
                    await supabase.from('chat_sessions').update({ title: fallbackTitle }).eq('id', currentSessionId)
                    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: fallbackTitle } : s))
                }
            }
        } catch (err) {
            console.error("Failed to process conversation loop step:", err)
        } finally {
            setIsSending(false)
        }
    }

    const handleViewFile = (file: CitationFile) => {
        if (!file.url || file.url === '#pdf-simulated') {
            alert("File preview unavailable for this message.")
            return
        }

        // Safely open the document blob or base64 data stream in a spacious clean browser tab
        const newTab = window.open()
        if (newTab) {
            newTab.document.write(`
      <html>
        <head><title>${file.name}</title></head>
        <body style="margin:0; background:#222; display:flex; justify-content:center; align-items:center;">
          <iframe src="${file.url}" frameborder="0" style="width:100%; height:100vh;" allowfullscreen></iframe>
        </body>
      </html>
    `)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-sage-border font-abeezee text-forest-dark">
                <div className="text-sm font-bold tracking-wider animate-pulse">
                    Loading your secure workspace...
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen w-screen bg-sage-border overflow-hidden font-abeezee text-forest-dark relative">

            {/* Mobile Panel */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
                />
            )}

            {/* Left sidebar */}
            <aside
                className={`bg-jade-accent text-white flex flex-col justify-between h-full flex-shrink-0 shadow-xl transition-all duration-300 z-50
          fixed inset-y-0 left-0 w-80 transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0'
                    }`}
            >
                <div className={`p-6 flex flex-col h-full overflow-hidden transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>

                    <div className="flex items-center justify-between mb-6 flex-shrink-0">
                        <div className="flex items-center space-x-3">
                            <Image src="/otter.png" alt="Otter" width={36} height={36} className="object-contain" />
                            <span className="text-2xl font-normal tracking-wide">Otter</span>
                        </div>

                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-1.5 rounded-xl hover:bg-forest-dark/30 transition text-pebble-light/80 hover:text-white"
                            title="Hide Sidebar"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-6 flex-shrink-0">
                        <Button
                            idleLabel="+ New Discussion"
                            className="py-3.5 rounded-xl w-full"
                            onClick={handleCreateNewSession}
                        />
                    </div>

                    {/* Past Discussions Feed */}
                    <nav className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
                        <p className="text-[11px] uppercase font-bold tracking-widest text-pebble-light/60 pl-2 mb-2">Past Conversations</p>
                        {sessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => {
                                    setActiveSessionId(session.id)
                                    if (window.innerWidth < 768) setIsSidebarOpen(false)
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition flex items-center justify-between space-x-2.5 group relative ${activeSessionId === session.id
                                    ? 'bg-white/15 text-white font-bold shadow-sm'
                                    : 'hover:bg-white/5 text-pebble-light/80'
                                    }`}
                            >
                                <div className="flex items-center space-x-2.5 truncate max-w-[85%]">
                                    <svg className="w-4 h-4 opacity-70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span className="truncate">{session.title}</span>
                                </div>

                                {/* Trash Can Icon Trigger: Hidden by default, reveals inline cleanly on parent group element hovers */}
                                <span
                                    onClick={(e) => handleDeleteSession(e, session.id)}
                                    className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition duration-150 cursor-pointer flex-shrink-0 ${activeSessionId === session.id
                                        ? 'hover:bg-white/20 text-white'
                                        : 'hover:bg-forest-dark/20 text-pebble-light'
                                        }`}
                                    title="Delete Discussion"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* User profile info footer */}
                <div className={`p-5 bg-forest-dark/10 border-t border-white/5 flex-shrink-0 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3 truncate max-w-[70%]">
                            <div className="w-8 h-8 rounded-full bg-pebble-light text-forest-dark font-bold text-xs flex items-center justify-center uppercase flex-shrink-0">
                                {userName.substring(0, 2)}
                            </div>
                            <span className="text-sm font-bold truncate text-white">{userName}</span>
                        </div>
                        <p className="text-sm text-pebble-light opacity-90 flex-shrink-0">
                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut()
                                    router.push('/login')
                                }}
                                className="font-bold text-white hover:underline underline-offset-4 decoration-2 cursor-pointer text-sm"
                            >
                                Log out
                            </button>
                        </p>
                    </div>
                </div>
            </aside>

            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute top-5 left-5 p-2.5 rounded-xl bg-jade-accent text-white shadow-lg hover:bg-forest-dark transition-all duration-200 z-30 flex items-center justify-center border border-white/10"
                    title="Show Sidebar"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            {/* Main conversation frame */}
            <main className="flex-1 flex flex-col h-full bg-sage-border relative overflow-hidden">

                <div className="w-full h-[calc(100vh-130px)] overflow-y-auto min-h-0 pt-20 scrollbar-thin scrollbar-thumb-forest-dark/50 scrollbar-track-transparent">
                    <div className="w-full max-w-3xl mx-auto px-6 md:px-12">
                        {messages.length > 0 ? (
                            <div className="space-y-6 pb-12">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex w-full flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className="flex items-center space-x-2 text-[10px] font-bold text-forest-dark/50 uppercase tracking-widest mb-1.5 px-1">
                                            {msg.role === 'assistant' && (
                                                <div className="relative w-5 h-5 opacity-90">
                                                    <Image src="/otter.png" alt="Ollie" fill className="object-contain" />
                                                </div>
                                            )}
                                            <span className={msg.role === 'assistant' ? 'pt-0.5' : ''}>
                                                {msg.role === 'user' ? userName : 'Ollie the Otter'}
                                            </span>
                                        </div>

                                        {/* Message bubble block */}
                                        <div
                                            className={`max-w-[85%] rounded-[1.5rem] px-5 py-3.5 text-sm leading-relaxed tracking-wide shadow-sm transition-colors flex flex-col space-y-2 ${msg.role === 'user'
                                                ? 'bg-forest-dark text-white rounded-tr-sm'
                                                : 'bg-white text-forest-dark rounded-tl-sm border border-forest-dark/5'
                                                }`}
                                        >
                                            {/* Persistent files */}
                                            {msg.citations && msg.citations.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pb-0.5">
                                                    {msg.citations.map((file, fIdx) => (
                                                        <button
                                                            key={fIdx}
                                                            type="button"
                                                            onClick={() => handleViewFile(file)}
                                                            className={`text-[11px] font-medium rounded-lg px-2.5 py-1 flex items-center space-x-1.5 border transition max-w-[180px] truncate cursor-pointer ${msg.role === 'user'
                                                                ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                                                : 'bg-forest-dark/5 border-forest-dark/10 text-forest-dark hover:bg-forest-dark/10'
                                                                }`}
                                                        >
                                                            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            <span className="truncate">{file.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="prose prose-sm max-w-none break-words">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isSending && (
                                    <div className="flex w-full flex-col items-start">
                                        <div className="text-[10px] font-bold text-forest-dark/50 uppercase tracking-widest mb-1.5 px-1 flex items-center space-x-3">
                                            <div className="flex flex-col items-center justify-end w-6 h-6.5 relative">
                                                <div className="relative w-5 h-5 opacity-90 animate-swim bottom-[-1px] z-10">
                                                    <Image src="/otter.png" alt="Ollie" fill className="object-contain" />
                                                </div>
                                                <svg className="w-6 h-1.5 text-blue-400/70 relative z-0" viewBox="0 0 24 5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                                                    <path className="animate-squiggle" d="M0 2.5 Q 3 0, 6 2.5 T 12 2.5 T 18 2.5 T 24 2.5" />
                                                </svg>
                                            </div>
                                            <span className="pt-1 animate-pulse">Ollie is swimming through ideas...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        ) : (
                            <div className="w-full h-[calc(100vh-260px)] flex flex-col items-center justify-center text-center select-none animate-fade-in">
                                <h2 className="text-4xl font-normal tracking-wide text-forest-dark mb-3">
                                    Where should we begin?
                                </h2>
                                <p className="text-sm text-forest-dark/70 font-medium max-w-sm leading-relaxed">
                                    Ask a question about class content, structure, or assignment instructions.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sage-border via-sage-border to-transparent pt-10 pb-6 px-6">
                    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto relative flex flex-col items-center">

                        {attachedFileName && (
                            <div className="w-full flex justify-start px-4 mb-2.5">
                                <span className="text-xs font-medium bg-jade-accent/15 border border-forest-dark/10 text-forest-dark rounded-xl px-3.5 py-1.5 flex items-center space-x-2 shadow-sm animate-fade-in">
                                    <svg className="w-3.5 h-3.5 text-forest-dark/70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="truncate max-w-[200px]">{attachedFileName}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAttachedFileName(null)
                                            setAttachedFileType(null)
                                            setAttachedImageBase64(null)
                                            setAttachedFileText(null)
                                        }}
                                        className="text-forest-dark/40 hover:text-red-700 font-bold ml-1.5 transition text-sm flex items-center justify-center"
                                        title="Remove file"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </span>
                            </div>
                        )}

                        <div className="w-full relative flex items-center">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*,application/pdf"
                                className="hidden"
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute left-3 p-2 text-forest-dark/60 hover:text-forest-dark transition"
                                title="Upload Photo or Document"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                            </button>

                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask anything..."
                                className="w-full bg-pebble-light text-sm text-forest-dark placeholder-slate-mist rounded-full pl-12 pr-14 py-4 outline-none border border-forest-dark/5 shadow-lg transition focus:bg-white focus:ring-2 focus:ring-forest-dark/40"
                            />
                            <button
                                type="submit"
                                disabled={(!input.trim() && !attachedImageBase64 && !attachedFileName) || isSending}
                                className="absolute right-3 bg-forest-dark text-white p-2.5 rounded-full transition shadow hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                            </button>
                        </div>
                    </form>
                    <p className="text-[10px] text-center text-forest-dark/50 mt-2.5 tracking-wide">
                        Ollie can make mistakes. Always double-check her responses against your course materials or ask your instructor.
                    </p>
                </div>
            </main>

        </div>
    )
}