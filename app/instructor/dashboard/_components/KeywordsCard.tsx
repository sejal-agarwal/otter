interface Props {
    keywords: { word: string; count: number }[]
    totalQueries: number
}

export function KeywordsCard({ keywords, totalQueries }: Props) {
    return (
        <div className="md:col-span-2 w-full bg-pebble-light/30 border border-sage-border/60 rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-forest-dark/80 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Common Query Keywords
            </h3>
            <div className="space-y-3">
                {keywords.length === 0 ? (
                    <p className="text-xs text-forest-dark/50 italic">Insufficient interaction data to cluster topics.</p>
                ) : (
                    keywords.map((item, idx) => (
                        <div key={idx} className="flex flex-col">
                            <div className="flex justify-between text-xs font-medium mb-1 px-1">
                                <span className="text-forest-dark font-mono">#{item.word}</span>
                                <span className="text-forest-dark/60">{item.count} hits</span>
                            </div>
                            <div className="w-full bg-forest-dark/10 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-jade-accent h-full rounded-full transition-all duration-500"
                                    style={{ width: `${(item.count / totalQueries) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
