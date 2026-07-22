# Otter

Otter is a **Retrieval-Augmented Generation (RAG)** workspace that unifies course materials like slide decks, syllabi, and reading materials into an interactive student AI chat interface - or as we like to call it, Ollie the Otter. While students get precise, source-backed answers tailored to their exact classroom scope, instructors gain access to an aggregated, fully anonymized metrics dashboard and automated weekly curriculum summaries.

---

## Features

### For Students

* **Grounded Context Chat:** Provides answers based off of the uploaded course materials preventing broad-scope AI hallucinations or irrelevant results.
* **Links you to Course Materials:** Directs students to the exact lecture slides and page numbers where relevant information to their questions exists.

### For Instructors

* **Anonymized Analytics Dashboard:** Helps instructors track active student adoption metrics and historical average queries per student.
* **Live Keyword Distributions:** Shows exactly where students are facing friction through real-time semantic keyword clustering .
* **Weekly Curriculum Sync:** Synthesizes the past 7 days of anonymous student queries into actionable bullet points using automated LLM summaries.
* **Knowledge Base Manager:** Supports dense PDFs and image formats via secure drag-and-drop vector compilation pipeline.

---

## Design Language & Theme

Otter is styled intentionally around an earthy, focus-driven academic palette configured directly inside Tailwind v4:

* **Jade Accent:** `#7B9669` (Action items, highlights, badges)
* **Pebble Light:** `#E6E6E6` (Glassmorphic panels, text container fills)
* **Slate Mist:** `#6C8480` (Subtle details, timestamps)
* **Sage Border:** `#BAC8B1` (Main viewport workspace backgrounds)
* **Forest Dark:** `#404E3B` (Primary brand typography, core buttons)

---

## Tech Stack & Architecture

* **Framework:** [Next.js](https://nextjs.org/) (App Router, Client/Server component splits)
* **Database & Auth:** [Supabase](https://supabase.com/) (Real-time schema, views, and secure row-level storage tracking)
* **AI Ingestion Model:** OpenAI `gpt-4o-mini` (Vectorized execution & automated semantic synthesis)
* **Styling Engine:** Tailwind CSS v4 featuring brand-native animations (`animate-swim`, `animate-squiggle`)

---

## Getting Started

### 1. Configure Local Environment Variables

Create a file named `.env.local` in the root folder directory and inject your secure api tokens:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=sk-proj-your-openai-api-key

```

### 2. Run the Development Pipeline

Boot up your secure local terminal workspace server engine:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev

```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) inside your web browser engine window layout workspace to inspect the running client application.

---

## Structural Layout Paths

* `app/page.tsx` — Homepage featuring custom real typewriter character loop script.
* `app/instructor/dashboard/page.tsx` — Aggregated database view tracking analytics.
* `app/api/instructor/summary/route.ts` — Server-side endpoint mapping historical query text metrics onto OpenAI compilation matrices.
* `components/LoadingOtter.tsx` — Branding mascot configuration tracking swimming vectors.

---

### Credits

* Brand typography mapped natively through `'ABeeZee', sans-serif`.
* Application graphics and main logo sourced cleanly from [Flaticon](https://www.flaticon.com).
* Engineered with love by **Sejal Agarwal**.