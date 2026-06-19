import React from 'react'

interface DashboardCardProps {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
  className?: string
}

export function DashboardCard({ icon, title, description, children, className = '' }: DashboardCardProps) {
  return (
    <div className={`bg-jade-accent text-white rounded-[2.5rem] p-8 border border-jade-accent shadow-2xl flex flex-col justify-between transition duration-200 hover:scale-[1.01] ${className}`}>
      <div className="space-y-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white mb-4 select-none">
          {icon}
        </div>
        
        <h2 className="text-xl font-bold tracking-wide text-white select-none">{title}</h2>
        <p className="text-xs text-pebble-light opacity-95 leading-relaxed font-medium select-none">
          {description}
        </p>
      </div>

      <div className="mt-8">
        {children}
      </div>
    </div>
  )
}