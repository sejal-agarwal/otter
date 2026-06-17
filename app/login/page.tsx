'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '../auth/actions'
import { AuthCard, AuthInput, AuthButton } from '@/components/AuthComponents'

interface FormErrors {
  email?: string
  password?: string
  server?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const isFormFilled = email.trim() !== '' && password.trim() !== ''

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const localErrors: FormErrors = {}
    const cleanEmail = email.trim().toLowerCase()

    // Immediate local institutional safety check
    if (!cleanEmail.endsWith('@uwaterloo.ca')) {
      localErrors.email = 'You must enter a valid @uwaterloo.ca email address.'
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors)
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('email', cleanEmail)
      formData.append('password', password)

      const result = await login(null, formData)

      if (result?.error) {
        setErrors({ server: result.error })
      } else if (result?.success && result.redirectTo) {
        router.push(result.redirectTo)
        router.refresh()
      }
    })
  }

  return (
    <AuthCard
      subtitle="Welcome back!"
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerHref="/signup"
    >
      <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
        <AuthInput
          label="UWaterloo Email"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="username@uwaterloo.ca"
          error={errors.email}
        />

        <AuthInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          error={errors.password}
        />

        {errors.server && (
          <p className="text-xs font-bold text-pebble-light text-center py-1">
            ⚠️ {errors.server}
          </p>
        )}

        <AuthButton
          isPending={isPending}
          disabled={!isFormFilled}
          idleLabel="Log In"
          pendingLabel="Verifying profile..."
        />
      </form>
    </AuthCard>
  )
}