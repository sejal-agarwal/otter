import { LoadingOtter } from '@/components/LoadingOtter'

interface Props {
    summary: string
    isLoading: boolean
}

export function AiSummaryCard({ summary, isLoading }: Props) {
    return (
        <div className="w-full md:col-span-5 bg-forest-dark text-pebble-light p-6 rounded-2xl mb-2 border border-forest-dark/20 shadow-md relative">
            <div className="flex items-center gap-2 mb-4">
                <span className="bg-jade-accent text-forest-dark text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                    AI Insights
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider opacity-90">Weekly Student Query Summaries</h2>
            </div>

            {isLoading ? (
                <div className="py-6 flex items-center justify-center">
                    <LoadingOtter
                        size="normal"
                        message="Running semantic synthesis on recent prompt clusters..."
                        className="text-pebble-light"
                    />
                </div>
            ) : (
                <div className="text-xs md:text-sm leading-relaxed opacity-90 font-light space-y-3 px-1">
                    {summary
                        .split('\n')
                        .filter(line => line.trim().length > 0)
                        .map((line, idx) => {
                            const cleanText = line.replace(/^\s*[•\-\*\s]+\s*/, '');
                            return (
                                <div key={idx} className="pl-5 relative break-words">
                                    <span className="absolute left-0 text-jade-accent font-bold select-none">•</span>
                                    {cleanText}
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    )
}
