interface DailyUsage {
    date: string
    count: number
}

interface Props {
    dailyUsage: DailyUsage[]
}

const CHART_W = 560
const CHART_H = 140
const PAD = { top: 15, right: 8, bottom: 28, left: 36 }
const INNER_W = CHART_W - PAD.left - PAD.right
const INNER_H = CHART_H - PAD.top - PAD.bottom

function formatLabel(dateStr: string): string {
    const [, month, day] = dateStr.split('-')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[parseInt(month) - 1]} ${parseInt(day)}`
}

export function UsageTimeline({ dailyUsage }: Props) {
    const hasData = dailyUsage.some(d => d.count > 0)
    const maxCount = Math.max(...dailyUsage.map(d => d.count), 1)
    const n = dailyUsage.length

    const getX = (i: number) => PAD.left + (n > 1 ? (i / (n - 1)) * INNER_W : INNER_W / 2)
    const getY = (count: number) => PAD.top + INNER_H - (count / maxCount) * INNER_H

    const lineD = dailyUsage.map((day, i) =>
        `${i === 0 ? 'M' : 'L'}${getX(i).toFixed(1)},${getY(day.count).toFixed(1)}`
    ).join(' ')

    const areaD = [
        `M${getX(0).toFixed(1)},${(PAD.top + INNER_H).toFixed(1)}`,
        ...dailyUsage.map((day, i) => `L${getX(i).toFixed(1)},${getY(day.count).toFixed(1)}`),
        `L${getX(n - 1).toFixed(1)},${(PAD.top + INNER_H).toFixed(1)}`,
        'Z'
    ].join(' ')

    // X-axis label interval based on span
    const labelInterval = n <= 7 ? 1 : n <= 14 ? 2 : n <= 30 ? 5 : n <= 60 ? 7 : 14
    const showDots = n <= 45

    // Y-axis ticks: 0, midpoint, max
    const midCount = Math.round(maxCount / 2)
    const yTicks = Array.from(new Set([0, midCount, maxCount]))

    return (
        <div className="md:col-span-3 w-full bg-pebble-light/30 border border-sage-border/60 rounded-2xl p-6 flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-wider text-forest-dark/80 mb-1">
                Usage Timeline
            </h3>
            <p className="text-[10px] text-forest-dark/50 font-medium mb-4">
                Student query volume from first interaction to today.
            </p>

            {!hasData ? (
                <div className="flex-1 flex items-center justify-center py-8">
                    <p className="text-xs text-forest-dark/50 italic">No interaction data yet.</p>
                </div>
            ) : (
                <svg
                    viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                    className="w-full"
                    aria-label="Usage timeline line chart"
                >
                    {/* Y-axis grid lines and labels */}
                    {yTicks.map(tick => {
                        const y = getY(tick)
                        return (
                            <g key={tick}>
                                <line
                                    x1={PAD.left} y1={y}
                                    x2={CHART_W - PAD.right} y2={y}
                                    stroke="#404E3B" strokeOpacity={0.07} strokeWidth={1}
                                />
                                <text
                                    x={PAD.left - 5}
                                    y={y + 3}
                                    textAnchor="end"
                                    fontSize={7.5}
                                    fill="#404E3B"
                                    fillOpacity={0.6}
                                    fontFamily="monospace"
                                >
                                    {tick}
                                </text>
                            </g>
                        )
                    })}

                    {/* X-axis baseline */}
                    <line
                        x1={PAD.left} y1={PAD.top + INNER_H}
                        x2={CHART_W - PAD.right} y2={PAD.top + INNER_H}
                        stroke="#404E3B" strokeOpacity={0.15} strokeWidth={1}
                    />

                    {/* Y-axis line */}
                    <line
                        x1={PAD.left} y1={PAD.top}
                        x2={PAD.left} y2={PAD.top + INNER_H}
                        stroke="#404E3B" strokeOpacity={0.15} strokeWidth={1}
                    />

                    {/* Area fill */}
                    <path d={areaD} fill="#7B9669" fillOpacity={0.12} />

                    {/* Line */}
                    <path
                        d={lineD}
                        fill="none"
                        stroke="#7B9669"
                        strokeWidth={1.8}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {/* Dots */}
                    {showDots && dailyUsage.map((day, i) => (
                        day.count > 0 && (
                            <circle
                                key={day.date}
                                cx={getX(i)} cy={getY(day.count)}
                                r={2.5}
                                fill="#7B9669"
                                stroke="white"
                                strokeWidth={1}
                            >
                                <title>{formatLabel(day.date)}: {day.count} {day.count === 1 ? 'query' : 'queries'}</title>
                            </circle>
                        )
                    ))}

                    {/* X-axis date labels */}
                    {dailyUsage.map((day, i) => {
                        const isFirst = i === 0
                        const isLast = i === n - 1
                        if (!isFirst && !isLast && i % labelInterval !== 0) return null

                        // Suppress last label if too close to the previous interval label
                        if (isLast && !isFirst && i % labelInterval !== 0 && i - (Math.floor((i - 1) / labelInterval) * labelInterval) < Math.ceil(labelInterval / 2)) return null

                        const x = getX(i)
                        const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle'
                        const labelX = isFirst ? PAD.left : isLast ? CHART_W - PAD.right : x

                        return (
                            <text
                                key={day.date}
                                x={labelX}
                                y={CHART_H - 5}
                                textAnchor={anchor}
                                fontSize={8}
                                fill="#404E3B"
                                fillOpacity={0.7}
                                fontFamily="monospace"
                            >
                                {formatLabel(day.date)}
                            </text>
                        )
                    })}
                </svg>
            )}
        </div>
    )
}
