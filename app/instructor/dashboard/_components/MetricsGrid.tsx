import { MetricState } from './types'

interface Props {
    metrics: MetricState
}

export function MetricsGrid({ metrics }: Props) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-pebble-light/40 border border-sage-border backdrop-blur-xs p-6 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group">
                <span className="text-xs font-bold tracking-wider uppercase text-forest-dark/60">Total Student Queries</span>
                <span className="text-4xl font-normal text-forest-dark mt-4 group-hover:scale-105 transition-transform origin-left block">
                    {metrics.totalQueries}
                </span>
            </div>

            <div className="bg-pebble-light/40 border border-sage-border backdrop-blur-xs p-6 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group">
                <span className="text-xs font-bold tracking-wider uppercase text-forest-dark/60">Active Student Users</span>
                <span className="text-4xl font-normal text-forest-dark mt-4 group-hover:scale-105 transition-transform origin-left block">
                    {metrics.activeStudents}
                </span>
            </div>

            <div className="bg-pebble-light/40 border border-sage-border backdrop-blur-xs p-6 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group">
                <span className="text-xs font-bold tracking-wider uppercase text-forest-dark/60">Avg. Queries / Student</span>
                <span className="text-4xl font-normal text-forest-dark mt-4 group-hover:scale-105 transition-transform origin-left block">
                    {metrics.avgQueriesPerStudent}
                </span>
            </div>

            <div className="bg-pebble-light/40 border border-sage-border backdrop-blur-xs p-6 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group">
                <span className="text-xs font-bold tracking-wider uppercase text-forest-dark/60">Avg. Prompt Length</span>
                <span className="text-4xl font-normal text-forest-dark mt-4 group-hover:scale-105 transition-transform origin-left block">
                    {metrics.avgPromptWordCount} <span className="text-base font-medium text-forest-dark/50">words</span>
                </span>
            </div>
        </div>
    )
}
