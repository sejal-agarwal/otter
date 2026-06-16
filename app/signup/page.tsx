'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { signup } from '../auth/actions'

export default function SignupPage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // Save form input values and error message in local state
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    // Check if all fields have text entered (ignoring whitespace padding)
    const isFormFilled = name.trim() !== '' && email.trim() !== '' && password.trim() !== ''

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage('')

        const cleanEmail = email.trim().toLowerCase()

        if (!cleanEmail.endsWith('@uwaterloo.ca')) {
            setErrorMessage('You must register with a valid @uwaterloo.ca email address.')
            return
        }

        if (password.length < 8) {
            setErrorMessage('Password must be at least 8 characters long.')
            return
        }

        startTransition(async () => {
            const formData = new FormData()
            formData.append('name', name.trim())
            formData.append('email', cleanEmail)
            formData.append('password', password)

            const result = await signup(null, formData)

            if (result?.error) {
                setErrorMessage(result.error)
            } else if (result?.success && result.redirectTo) {
                router.push(result.redirectTo)
                router.refresh()
            }
        })
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-sage-border px-4 select-none font-abeezee">
            <div className="w-full max-w-md space-y-6 rounded-[2.5rem] bg-jade-accent p-10 shadow-2xl border border-jade-accent text-white text-center">
                <div className="flex flex-col items-center space-y-2">
                    <div className="relative h-20 w-20 transition-transform duration-300 hover:scale-105">
                        <Image
                            src="/otter.png"
                            alt="sea-otter.png"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-4xl font-normal tracking-wide text-white">
                        Otter
                    </h1>
                    <p className="text-base text-pebble-light font-medium tracking-wide opacity-90">
                        Sign up for an account!
                    </p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-5 text-left">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold tracking-wider text-pebble-light uppercase pl-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Student Name"
                            className="w-full rounded-2xl bg-pebble-light px-5 py-3.5 text-sm text-forest-dark placeholder-slate-mist outline-none border border-transparent transition focus:bg-white focus:ring-2 focus:ring-forest-dark"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold tracking-wider text-pebble-light uppercase pl-1">
                            UWaterloo Email
                        </label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="username@uwaterloo.ca"
                            className="w-full rounded-2xl bg-pebble-light px-5 py-3.5 text-sm text-forest-dark placeholder-slate-mist outline-none border border-transparent transition focus:bg-white focus:ring-2 focus:ring-forest-dark"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold tracking-wider text-pebble-light uppercase pl-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                            className="w-full rounded-2xl bg-pebble-light px-5 py-3.5 text-sm text-forest-dark placeholder-slate-mist outline-none border border-transparent transition focus:bg-white focus:ring-2 focus:ring-forest-dark"
                        />
                    </div>

                    {errorMessage && (
                        <p className="text-sm font-medium text-pebble-light text-center tracking-wide px-2 py-1 animate-fadeIn">
                            ⚠️ {errorMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={!isFormFilled || isPending}
                        className="w-full rounded-2xl bg-forest-dark py-4 text-sm font-bold text-white transition duration-200 hover:opacity-85 active:scale-[0.98] shadow-lg mt-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
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