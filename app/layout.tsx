import { ABeeZee } from 'next/font/google'
import './globals.css'

const abeezee = ABeeZee({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-abeezee',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={abeezee.variable}>
      <body 
        className="bg-[#BAC8B1] antialiased" 
        style={{ fontFamily: 'var(--font-abeezee), sans-serif' }}
      >
        {children}
      </body>
    </html>
  )
}