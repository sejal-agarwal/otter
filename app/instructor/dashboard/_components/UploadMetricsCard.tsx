import { UploadMetrics } from './types'

interface Props {
    uploadMetrics: UploadMetrics
}

export function UploadMetricsCard({ uploadMetrics }: Props) {
    const { totalUploads, studentsWhoUploaded, imageCount, pdfCount } = uploadMetrics
    const imagePercent = totalUploads > 0 ? Math.round((imageCount / totalUploads) * 100) : 0
    const pdfPercent = totalUploads > 0 ? Math.round((pdfCount / totalUploads) * 100) : 0

    return (
        <div className="md:col-span-2 w-full bg-pebble-light/30 border border-sage-border/60 rounded-2xl p-6 flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-wider text-forest-dark/80 mb-1 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Upload Activity
            </h3>
            <p className="text-[10px] text-forest-dark/50 font-medium mb-5">
                Files students attach during chat sessions.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-pebble-light/60 rounded-xl p-4 border border-sage-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-forest-dark/50 block mb-1">Total Uploads</span>
                    <span className="text-3xl font-normal text-forest-dark">{totalUploads}</span>
                </div>
                <div className="bg-pebble-light/60 rounded-xl p-4 border border-sage-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-forest-dark/50 block mb-1">Students Uploading</span>
                    <span className="text-3xl font-normal text-forest-dark">{studentsWhoUploaded}</span>
                </div>
            </div>

            {totalUploads === 0 ? (
                <p className="text-xs text-forest-dark/50 italic text-center mt-2">No student uploads recorded yet.</p>
            ) : (
                <div className="space-y-2.5">
                    <div className="flex justify-between text-[10px] font-semibold text-forest-dark/70 mb-1">
                        <span>File Type Breakdown</span>
                        <span>{totalUploads} total</span>
                    </div>

                    <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-forest-dark/10">
                        <div className="bg-jade-accent h-full transition-all" style={{ width: `${imagePercent}%` }} />
                        <div className="bg-forest-dark/50 h-full transition-all" style={{ width: `${pdfPercent}%` }} />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium">
                            <span className="w-2 h-2 rounded-full bg-jade-accent" />
                            <span className="text-forest-dark/80">Images:</span>
                            <span className="text-forest-dark font-bold">{imageCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium">
                            <span className="w-2 h-2 rounded-full bg-forest-dark/50" />
                            <span className="text-forest-dark/80">PDFs:</span>
                            <span className="text-forest-dark font-bold">{pdfCount}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
