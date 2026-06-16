'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { signup } from '../auth/actions'

interface FormErrors {
  email?: string
  password?: string
  server?: string
}

export default function SignupPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [errors, setErrors] = useState<FormErrors>({})

  const isFormFilled = name.trim() !== '' && email.trim() !== '' && password.trim() !== ''

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({}) 

    const localErrors: FormErrors = {}
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail.endsWith('@uwaterloo.ca')) {
      localErrors.email = 'Please register with a valid @uwaterloo.ca email.'
    }

    if (password.length < 8) {
      localErrors.password = 'Password must be at least 8 characters long.'
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors)
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('email', cleanEmail)
      formData.append('password', password)

      const result = await signup(null, formData)

      if (result?.error) {
        setErrors({ server: result.error })
      } else if (result?.success && result.redirectTo) {
        router.push(result.redirectTo)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sage-border px-4 select-none font-abeezee">
      {/* Main Structural Card */}
      <div className="w-full max-w-md space-y-6 rounded-[2.5rem] bg-jade-accent p-10 shadow-2xl border border-jade-accent text-white text-center">
        
        {/* Identity & Branding */}
        <div className="flex flex-col items-center space-y-2">
          <div className="relative h-20 w-20 transition-transform duration-300 hover:scale-105">
            <Image src="/otter.png" alt="Otter Logo" fill className="object-contain" priority />
          </div>
          <h1 className="text-4xl font-normal tracking-wide text-white">Otter</h1>
          <p className="text-base text-pebble-light font-medium opacity-90">Create your account!</p>
        </div>

        {/* Form Stream */}
        <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
          
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-pebble-light pl-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sejal Agarwal"
              className="w-full rounded-2xl bg-pebble-light px-5 py-3.5 text-sm text-forest-dark placeholder-slate-mist outline-none border-2 border-transparent transition focus:bg-white focus:ring-2 focus:ring-forest-dark"
            />
          </div>

          {/* Waterloo Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-pebble-light pl-1">UWaterloo Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="username@uwaterloo.ca"
              className="w-full rounded-2xl bg-pebble-light px-5 py-3.5 text-sm text-forest-dark placeholder-slate-mist outline-none border-2 border-transparent transition focus:bg-white focus:ring-2 focus:ring-forest-dark"
            />
            {errors.email && (
              <p className="text-xs font-medium text-pebble-light pl-1 mt-1 animate-fadeIn">
                ⚠️ {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-pebble-light pl-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full rounded-2xl bg-pebble-light px-5 py-3.5 text-sm text-forest-dark placeholder-slate-mist outline-none border-2 border-transparent transition focus:bg-white focus:ring-2 focus:ring-forest-dark"
            />
            {errors.password && (
              <p className="text-xs font-medium text-pebble-light pl-1 mt-1 animate-fadeIn">
                ⚠️ {errors.password}
              </p>
            )}
          </div>

          {/* Generic/Server Error fallback */}
          {errors.server && (
            <p className="text-xs font-bold text-pebble-light text-center py-1">⚠️ {errors.server}</p>
          )}

          {/* Submit Trigger */}
          <button
            type="submit"
            disabled={!isFormFilled || isPending}
            className="w-full rounded-2xl bg-forest-dark py-4 text-sm font-bold text-white transition duration-200 hover:opacity-95 active:scale-[0.98] shadow-lg mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? 'Creating your account...' : 'Sign Up'}
          </button>
        </form>

        <div className="h-[1px] w-full bg-pebble-light opacity-20 my-2" />

        <p className="text-sm text-pebble-light opacity-90">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-white hover:underline underline-offset-4 decoration-2">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}