import Image from 'next/image'
import Link from 'next/link'

interface AuthCardProps {
  subtitle: string
  footerText: string
  footerLinkText: string
  footerHref: string
  children: React.ReactNode
}

export function AuthCard({ subtitle, footerText, footerLinkText, footerHref, children }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sage-border px-4 select-none font-abeezee">
      <div className="w-full max-w-md space-y-6 rounded-[2.5rem] bg-jade-accent p-10 shadow-2xl border border-jade-accent text-white text-center">
        {/* Branding Header */}
        <div className="flex flex-col items-center space-y-2">
          <Link href="/" className="flex flex-col items-center space-y-2 cursor-pointer text-inherit hover:text-inherit no-underline">
            <div className="relative h-20 w-20 transition-transform duration-300 hover:scale-105">
              <Image src="/otter.png" alt="Otter Logo" fill className="object-contain" priority />
            </div>
            <h1 className="text-4xl font-normal tracking-wide text-white">Otter</h1>
          </Link>

          <p className="text-base text-pebble-light font-medium opacity-90">{subtitle}</p>
        </div>

        {children}

        {/* Dynamic Footer and Links */}
        <div className="h-[1px] w-full bg-pebble-light opacity-20 my-2" />
        <p className="text-sm text-pebble-light opacity-90">
          {footerText}{' '}
          <Link href={footerHref} className="font-bold text-white hover:underline underline-offset-4 decoration-2">
            {footerLinkText}
          </Link>
        </p>
      </div>
    </div>
  )
}

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function AuthInput({ label, error, ...props }: AuthInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-pebble-light pl-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-2xl bg-pebble-light px-5 py-3.5 text-sm text-forest-dark placeholder-slate-mist outline-none border-2 border-transparent transition focus:bg-white focus:ring-2 focus:ring-slate-mist"
      />
      {error && (
        <p className="text-xs font-medium text-pebble-light pl-1 mt-1 animate-fadeIn">
          ⚠️ {error}
        </p>
      )}
    </div>
  )
}
