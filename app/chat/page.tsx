'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/Button' 

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ChatSession {
  id: string
  title: string
}

export default function StudentChatPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState('')
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  // Local Mock States for design verification
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: 'session-1', title: 'User Interface Evaluation Methods' },
    { id: 'session-2', title: 'Next.js Folder Routing Question' }
  ])
  const [activeSessionId, setActiveSessionId] = useState<string | null>('session-1')
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm1', role: 'assistant', content: "Hi! I'm Ollie the Otter, your classroom teaching assistant. Ask me any questions about your course readings, upcoming assignments, or design principles!" },
    { id: 'm2', role: 'user', content: 'What are the main principles of heuristic evaluations?' },
    { id: 'm3', role: 'assistant', content: 'Heuristic evaluation involves inspecting an interface against a set of established usability principles (like Nielsen’s 10 heuristics). Key areas include visibility of system status, matching the system to the real world, and user control and freedom.' }
  ])
  
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auth Guard check
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push('/login')
          return
        }

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
        
        setIsLoading(false)
      } catch (err) {
        console.error('Secure workspace loading failure:', err)
        router.push('/login')
      }
    }
    checkAuth()
  }, [router, supabase])

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim()
    }

    setMessages((prev) => [...prev, newMsg])
    setInput('')
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
    <div className="flex h-screen w-screen bg-sage-border overflow-hidden font-abeezee text-forest-dark select-none relative">
      
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
          fixed inset-y-0 left-0 w-80 transform md:relative md:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0'
          }`}
      >
        <div className={`p-6 flex flex-col h-full overflow-hidden transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          
          {/* Header Row: Brand Logo and Collapse Arrow Trigger */}
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
              className="py-3.5 rounded-xl"
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
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition truncate flex items-center space-x-2.5 ${
                  activeSessionId === session.id 
                    ? 'bg-white/15 text-white font-bold shadow-sm' // Soft semi-transparent sage tint selection variant
                    : 'hover:bg-white/5 text-pebble-light/80' // Muted, clean inactive hover overlay
                }`}
              >
                <svg className="w-4 h-4 opacity-70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="truncate">{session.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User Account Profile Card Deck */}
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
        
        <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-6 md:px-12 min-h-0 pt-20">
          {messages.length > 0 ? (
            <div className="space-y-6 pb-40">
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
                  
                  {/* Speaker Dialogue Blocks: User is Forest Dark, Ollie is clean Off-White */}
                  <div 
                    className={`max-w-[85%] rounded-[1.5rem] px-5 py-3.5 text-sm leading-relaxed tracking-wide shadow-sm transition-colors ${
                      msg.role === 'user'
                        ? 'bg-forest-dark text-white rounded-tr-sm' 
                        : 'bg-white text-forest-dark rounded-tl-sm border border-forest-dark/5' 
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center pb-24">
              <h2 className="text-4xl font-normal tracking-wide text-forest-dark mb-2">
                Where should we begin?
              </h2>
              <p className="text-sm text-forest-dark/70 font-medium max-w-sm">
                Ask a question about class readings, case reviews, or assignment instructions.
              </p>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sage-border via-sage-border to-transparent pt-10 pb-6 px-6">
          <form onSubmit={handleLocalSubmit} className="max-w-2xl mx-auto relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="w-full bg-pebble-light text-sm text-forest-dark placeholder-slate-mist rounded-full pl-6 pr-14 py-4 outline-none border border-forest-dark/5 shadow-lg transition focus:bg-white focus:ring-2 focus:ring-forest-dark/40"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-3 bg-forest-dark text-white p-2.5 rounded-full transition shadow hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </form>
          <p className="text-[10px] text-center text-forest-dark/50 mt-2.5 tracking-wide">
            Ollie can make mistakes. Always double-check her responses against your course materials or ask your instructor.
          </p>
        </div>
      </main>

    </div>
  )
}