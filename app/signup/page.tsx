'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signup } from '../auth/actions'
import { AuthCard, AuthInput, AuthButton } from '@/components/AuthComponents'
import { Button } from '@/components/Button'

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
    <AuthCard
      subtitle="Create your account!"
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerHref="/login"
    >
      <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
        <AuthInput
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sejal Agarwal"
        />

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
          placeholder="Min. 8 characters"
          error={errors.password}
        />

        {errors.server && (
          <p className="text-xs font-bold text-pebble-light text-center py-1">
            ⚠️ {errors.server}
          </p>
        )}

        <Button
          type="submit"
          isPending={isPending}
          disabled={!isFormFilled}
          idleLabel="Sign Up"
          pendingLabel="Creating your account..."
          className="mt-2"
        />
      </form>
    </AuthCard>
  )
}