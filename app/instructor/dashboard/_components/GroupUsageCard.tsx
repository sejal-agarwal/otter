'use client'

import { useState } from 'react'
import { GroupUsage } from './types'

interface Props {
    groupMetrics: GroupUsage[]
}

const COLORS = ['#7B9669', '#404E3B', '#404E3B80', '#7B966980']
const TAILWIND_COLORS = ['bg-jade-accent', 'bg-forest-dark', 'bg-forest-dark/40', 'bg-jade-accent/40']

const CHART_H = 64
const PAD = { top: 6, right: 2, bottom: 18, left: 2 }
const INNER_H = CHART_H - PAD.top - PAD.bottom

function formatDateShort(dateStr: string): string {
    const [, month, day] = dateStr.split('-')
    return `${month}/${parseInt(day)}`
}

function GroupTimeline({ group }: { group: GroupUsage }) {
    const members = group.studentBreakdown.map(s => s.studentIdAnon)
    const hasData = group.timeline.some(d => Object.keys(d.memberCounts).length > 0)
    const maxDayTotal = Math.max(...group.timeline.map(d =>
        Object.values(d.memberCounts).reduce((s, c) => s + c, 0)
    ), 1)

    const slotW = 100 / group.timeline.length // percentage per slot

    if (!hasData) {
        return <p className="text-[10px] text-forest-dark/50 italic py-2 text-center">No timeline data for this group.</p>
    }

    return (
        <div className="w-full" style={{ height: CHART_H }}>
            <svg viewBox={`0 0 ${group.timeline.length * 24} ${CHART_H}`} className="w-full h-full">
                {/* Baseline */}
                <line
                    x1={PAD.left} y1={PAD.top + INNER_H}
                    x2={group.timeline.length * 24 - PAD.right} y2={PAD.top + INNER_H}
                    stroke="#404E3B" strokeOpacity={0.12} strokeWidth={0.5}
                />
                {group.timeline.map((day, i) => {
                    const dayTotal = Object.values(day.memberCounts).reduce((s, c) => s + c, 0)
                    if (dayTotal === 0) {
                        const showLabel = i === 0 || i === group.timeline.length - 1
                        return (
                            <g key={day.date}>
                                {showLabel && (
                                    <text x={i * 24 + 12} y={CHART_H - 3} textAnchor="middle" fontSize={5.5} fill="#404E3B" fillOpacity={0.4} fontFamily="monospace">
                                        {formatDateShort(day.date)}
                                    </text>
                                )}
                            </g>
                        )
                    }
                    const totalBarH = (dayTotal / maxDayTotal) * INNER_H
                    const barW = 18
                    const x = i * 24 + (24 - barW) / 2

                    let currentY = PAD.top + INNER_H
                    const showLabel = i === 0 || i % 4 === 0 || i === group.timeline.length - 1

                    return (
                        <g key={day.date}>
                            {members.map((member, mIdx) => {
                                const count = day.memberCounts[member] || 0
                                if (count === 0) return null
                                const segH = (count / maxDayTotal) * INNER_H
                                currentY -= segH
                                const segY = currentY
                                return (
                                    <rect
                                        key={member}
                                        x={x} y={segY}
                                        width={barW} height={segH}
                                        fill={COLORS[mIdx % COLORS.length]}
                                        rx={mIdx === 0 ? 2 : 0}
                                    >
                                        <title>{formatDateShort(day.date)} — {member}: {count}</title>
                                    </rect>
                                )
                            })}
                            {showLabel && (
                                <text x={x + barW / 2} y={CHART_H - 3} textAnchor="middle" fontSize={5.5} fill="#404E3B" fillOpacity={0.4} fontFamily="monospace">
                                    {formatDateShort(day.date)}
                                </text>
                            )}
                        </g>
                    )
                })}
            </svg>
        </div>
    )
}

export function GroupUsageCard({ groupMetrics }: Props) {
    const [showTimeline, setShowTimeline] = useState(false)

    return (
        <div className="md:col-span-3 w-full bg-pebble-light/30 border border-sage-border/60 rounded-2xl p-6 flex flex-col max-h-[420px]">
            <div className="flex items-start justify-between mb-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-forest-dark/80">
                    Team AI Usage Distribution
                </h3>
                <div className="flex items-center bg-forest-dark/8 rounded-lg p-0.5 gap-0.5 ml-2 shrink-0">
                    <button
                        onClick={() => setShowTimeline(false)}
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all cursor-pointer ${!showTimeline ? 'bg-white shadow-xs text-forest-dark' : 'text-forest-dark/50 hover:text-forest-dark/70'}`}
                    >
                        Distribution
                    </button>
                    <button
                        onClick={() => setShowTimeline(true)}
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all cursor-pointer ${showTimeline ? 'bg-white shadow-xs text-forest-dark' : 'text-forest-dark/50 hover:text-forest-dark/70'}`}
                    >
                        Timeline
                    </button>
                </div>
            </div>
            <p className="text-[10px] text-forest-dark/50 font-medium mb-4">
                {showTimeline
                    ? 'Per-member contribution over the last 20 days.'
                    : 'Monitors collaboration patterns within project groups.'}
            </p>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {groupMetrics.length === 0 ? (
                    <p className="text-xs text-forest-dark/50 italic py-4 text-center">No team interaction metrics recorded yet.</p>
                ) : (
                    groupMetrics.map((group, gIdx) => (
                        <div key={gIdx} className="p-4 bg-pebble-light/60 border border-sage-border rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold font-mono text-forest-dark">{group.groupName}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-forest-dark/5 text-forest-dark/70 font-semibold px-2 py-0.5 rounded-md">
                                        {group.totalGroupQueries} queries total
                                    </span>
                                    {group.isUneven && (
                                        <span className="text-[9px] bg-amber-600/10 text-amber-800 border border-amber-600/20 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                                            Asymmetric Usage
                                        </span>
                                    )}
                                </div>
                            </div>

                            {showTimeline ? (
                                <GroupTimeline group={group} />
                            ) : (
                                <>
                                    <div className="w-full bg-forest-dark/5 h-3 rounded-full flex overflow-hidden border border-forest-dark/5 shadow-inner">
                                        {group.studentBreakdown.map((student, sIdx) => (
                                            <div
                                                key={sIdx}
                                                className={`${TAILWIND_COLORS[sIdx % TAILWIND_COLORS.length]} h-full transition-all`}
                                                style={{ width: `${student.percentage}%` }}
                                                title={`${student.studentIdAnon}: ${student.count} prompts (${student.percentage}%)`}
                                            />
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                                        {group.studentBreakdown.map((student, sIdx) => (
                                            <div key={sIdx} className="flex items-center space-x-1.5 text-[10px] font-medium">
                                                <span className={`w-2 h-2 rounded-full ${TAILWIND_COLORS[sIdx % TAILWIND_COLORS.length]}`} />
                                                <span className="text-forest-dark/80">{student.studentIdAnon}:</span>
                                                <span className="text-forest-dark font-bold">{student.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Legend always visible in timeline mode */}
                            {showTimeline && (
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    {group.studentBreakdown.map((student, sIdx) => (
                                        <div key={sIdx} className="flex items-center space-x-1.5 text-[10px] font-medium">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[sIdx % COLORS.length] }} />
                                            <span className="text-forest-dark/80">{student.studentIdAnon}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
