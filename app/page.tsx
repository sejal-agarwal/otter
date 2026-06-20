'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/Buttons'

export default function HomePage() {
  const router = useRouter()

  const phrases = ["Syllabus Navigation.", "Course Content Relevant Answers.", "Smart RAG Interactions.", "Aggregated Class Insights."]
  const [displayText, setDisplayText] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    const currentFullText = phrases[phraseIdx]

    if (!isDeleting) {
      if (displayText.length < currentFullText.length) {
        timer = setTimeout(() => {
          setDisplayText(currentFullText.substring(0, displayText.length + 1))
        }, 80)
      } else {
        timer = setTimeout(() => setIsDeleting(true), 2000)
      }
    } else {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentFullText.substring(0, displayText.length - 1))
        }, 40)
      } else {
        setIsDeleting(false)
        setPhraseIdx((prev) => (prev + 1) % phrases.length)
      }
    }

    return () => clearTimeout(timer)
  }, [displayText, isDeleting, phraseIdx])

  return (
    <div className="min-h-screen w-screen bg-sage-border font-abeezee text-forest-dark flex flex-col overflow-x-hidden selection:bg-forest-dark selection:text-pebble-light">

      <nav className="w-full h-20 px-6 md:px-10 max-w-7xl mx-auto flex justify-between items-center select-none">
        <div className="flex items-center space-x-3">
          <Image src="/otter.png" alt="Otter Logo" width={36} height={36} className="object-contain" priority />
          <span className="text-2xl font-normal tracking-wide text-forest-dark">Otter</span>
        </div>

        <div className="flex items-center space-x-6">
          <button
            onClick={() => router.push('/login')}
            className="text-sm font-bold text-forest-dark hover:underline underline-offset-4 decoration-2 transition cursor-pointer"
          >
            Log In
          </button>
          <button
            onClick={() => router.push('/signup')}
            className="text-sm font-bold bg-forest-dark text-pebble-light px-5 py-2.5 rounded-full shadow-md hover:opacity-85 transition active:scale-95 cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 flex flex-col items-center justify-center text-center pt-8 md:pt-14 pb-16">

        <div className="w-24 h-24 relative mb-8 flex flex-col items-center justify-end group select-none">
          <div className="relative w-16 h-16 animate-swim bottom-[-1px] z-10">
            <Image src="/otter.png" alt="Ollie the Otter" fill className="object-contain" priority />
          </div>
          <svg className="w-16 h-3 relative z-0 text-blue-400/70 fill-none" viewBox="0 0 24 5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <path className="animate-squiggle" d="M0 2.5 Q 3 0, 6 2.5 T 12 2.5 T 18 2.5 T 24 2.5" />
          </svg>
        </div>

        <h1 className="text-3xl md:text-5xl font-normal tracking-wide text-forest-dark max-w-4xl leading-tight flex flex-col items-center">
          <span><strong>Otter</strong>, built for</span>
          <span className="font-bold text-jade-accent min-h-[48px] md:min-h-[64px] relative block mt-2">
            {displayText}
            <span className="inline-block w-[3px] h-7 md:h-11 bg-jade-accent animate-pulse ml-1.5 align-middle" />
          </span>
        </h1>

        <p className="text-sm md:text-base max-w-2xl text-forest-dark/70 font-medium leading-relaxed mt-6">
          Otter transforms dense lecture slides, syllabi, and study guides into an interactive, localized AI chat workspace. Students receive instant, source-backed context from their course materials, while instructors gain fully anonymized, aggregated insights into common class questions and friction points.
        </p>

        <div className="mt-10 w-full max-w-xs mx-auto">
          <Button
            idleLabel="Create Your Account"
            onClick={() => router.push('/signup')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mt-20 text-left items-stretch">

          <div className="bg-pebble-light/30 border border-sage-border/60 p-6 rounded-2xl flex flex-col shadow-xs transition hover:translate-y-[-2px] duration-200">
            <div className="p-2.5 bg-forest-dark/5 rounded-xl text-forest-dark w-10 h-10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-bold text-sm tracking-wide uppercase text-forest-dark">Student AI Chat Space</h3>
            <p className="text-xs text-forest-dark/70 font-medium mt-2 leading-relaxed">
              Query your textbook materials, past handouts, and coding repositories in one conversational assistant frame. Get tailored, targeted layout breakdowns matching exactly what was discussed in class.
            </p>
          </div>

          <div className="bg-pebble-light/30 border border-sage-border/60 p-6 rounded-2xl flex flex-col shadow-xs transition hover:translate-y-[-2px] duration-200">
            <div className="p-2.5 bg-forest-dark/5 rounded-xl text-forest-dark w-10 h-10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-bold text-sm tracking-wide uppercase text-forest-dark">Anonymized Instructor Analytics</h3>
            <p className="text-xs text-forest-dark/70 font-medium mt-2 leading-relaxed">
              Track student engagement trends seamlessly. Instantly see aggregated topic clusters, trending query keywords, and custom automated weekly summaries without compromising identity privacy.
            </p>
          </div>

        </div>

      </main>

      <footer className="w-full py-6 text-center text-[10px] text-forest-dark/40 font-semibold uppercase tracking-widest border-t border-forest-dark/5 select-none mt-auto space-y-1">
        <div className="opacity-80 tracking-wider">
          Logo sourced from{' '}
          <a
            href="https://www.flaticon.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline underline-offset-4 decoration-2 normal-case font-bold"
          >
            Flaticon
          </a>
          {' '}• Made by Sejal Agarwal
        </div>
      </footer>
    </div>
  )
}