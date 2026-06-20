'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ReturnToInstructorConsoleButton } from '@/components/Buttons'
import { LoadingOtter } from '@/components/LoadingOtter'
import { Header } from '@/components/Header'

interface UploadedMaterial {
    id: string
    name: string
    type: string
    size: string
    uploaded_at: string
    url: string
}

export default function MaterialsUploadPage() {
    const supabase = createClient()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [materials, setMaterials] = useState<UploadedMaterial[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editNameValue, setEditNameValue] = useState('')

    useEffect(() => {
        async function initializeKnowledgeBase() {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser()
                if (authError || !user) return router.push('/login')
                setCurrentUserId(user.id)

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profileError || profile?.role !== 'INSTRUCTOR') return router.push('/chat')

                const { data: dbFiles, error: dbError } = await supabase
                    .from('course_materials')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (!dbError && dbFiles) {
                    const formattedFiles = dbFiles.map(file => {
                        const { data } = supabase.storage.from('course-knowledge-base').getPublicUrl(file.storage_path)
                        return {
                            id: file.id,
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            uploaded_at: file.created_at.split('T')[0],
                            url: data.publicUrl
                        }
                    })
                    setMaterials(formattedFiles)
                }

                setIsLoading(false)
            } catch (err) {
                console.error('Failed to load active RAG repository data:', err)
                router.push('/login')
            }
        }
        initializeKnowledgeBase()
    }, [router, supabase])

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(e.type === 'dragenter' || e.type === 'dragover')
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processFiles(e.dataTransfer.files)
        }
    }

    const processFiles = async (fileList: FileList) => {
        if (!currentUserId) return
        const filesArray = Array.from(fileList)
        const validFiles = filesArray.filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'))

        if (validFiles.length === 0) return alert('Please provide high-density PDFs or image formats.')
        setIsUploading(true)

        try {
            for (const file of validFiles) {
                const customStorageFileName = `${currentUserId}/${crypto.randomUUID()}-${file.name}`

                // Upload to Supabase Storage
                const { error: storageErr } = await supabase.storage
                    .from('course-knowledge-base')
                    .upload(customStorageFileName, file, { cacheControl: '3600', upsert: false })

                if (storageErr) throw storageErr

                // Insert into the course_materials table
                const { data: insertedRow, error: tableErr } = await supabase
                    .from('course_materials')
                    .insert({
                        name: file.name,
                        type: file.type,
                        size: `${(file.size / 1024).toFixed(0)} KB`,
                        storage_path: customStorageFileName,
                        uploaded_by: currentUserId
                    })
                    .select()
                    .single()

                if (tableErr) throw tableErr

                // SECURE BLOCKING PIPELINE: Await the vector engine explicitly
                const embedResponse = await fetch('/api/embed', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        materialId: insertedRow.id,
                        storagePath: customStorageFileName
                    })
                })

                const embedResult = await embedResponse.json()

                if (!embedResponse.ok || !embedResult.success) {
                    throw new Error(embedResult.error || 'Vector compilation broke down.')
                }
                const { data: urlData } = supabase.storage.from('course-knowledge-base').getPublicUrl(customStorageFileName)

                setMaterials(prev => [{
                    id: insertedRow.id,
                    name: insertedRow.name,
                    type: insertedRow.type,
                    size: insertedRow.size,
                    uploaded_at: insertedRow.created_at.split('T')[0],
                    url: urlData.publicUrl
                }, ...prev])
            }
        } catch (err: any) {
            console.error('Ingestion failure:', err)
            alert(`Failed to parse your document corpus: ${err.message || err}`)
        } finally {
            setIsUploading(false)
        }
    }

    const startRenaming = (e: React.MouseEvent, file: UploadedMaterial) => {
        e.stopPropagation()
        setEditingId(file.id)
        setEditNameValue(file.name)
    }

    const saveNewName = async (id: string) => {
        if (!editNameValue.trim()) return
        let finalizedName = editNameValue.trim()

        const { error } = await supabase
            .from('course_materials')
            .update({ name: finalizedName })
            .eq('id', id)

        if (!error) {
            setMaterials(prev => prev.map(m => m.id === id ? { ...m, name: finalizedName } : m))
            setEditingId(null)
        }
    }

    const handleRemoveFile = async (e: React.MouseEvent, file: UploadedMaterial) => {
        e.stopPropagation()

        const { data: targetMaterial } = await supabase
            .from('course_materials')
            .select('storage_path')
            .eq('id', file.id)
            .single()

        if (targetMaterial) {
            await supabase.storage.from('course-knowledge-base').remove([targetMaterial.storage_path])
            await supabase.from('course_materials').delete().eq('id', file.id)
            setMaterials(prev => prev.filter(m => m.id !== file.id))
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-sage-border font-abeezee text-forest-dark">
                <div className="text-sm font-bold tracking-wider animate-pulse">Loading secure master reference indices...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-screen bg-sage-border font-abeezee text-forest-dark flex flex-col overflow-y-auto relative scrollbar-thin scrollbar-thumb-forest-dark/50 scrollbar-track-transparent">
            <Header />

            <div className="relative w-full h-12 flex-shrink-0 mt-4">
                <ReturnToInstructorConsoleButton />
            </div>

            <div className="flex-1 w-full flex flex-col px-6 pt-12 pb-16 max-w-4xl mx-auto">

                <div className="w-full text-left select-none pb-8 flex-shrink-0">
                    <h1 className="text-2xl md:text-3xl font-normal tracking-wide text-forest-dark">Knowledge Base Manager</h1>
                    <p className="text-xs text-forest-dark/60 font-medium mt-1">Upload files to embed system parameters permanently.</p>
                </div>

                <div
                    onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full border-2 border-dashed rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center cursor-pointer transition flex-shrink-0 ${dragActive ? 'border-white bg-jade-accent text-white scale-[0.99]' : 'border-jade-accent/30 bg-jade-accent text-white shadow-2xl hover:scale-[1.005]'
                        }`}
                >
                    <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && processFiles(e.target.files)} accept="image/*,application/pdf" multiple className="hidden" />

                    <div className="space-y-4 max-w-sm pointer-events-none select-none flex flex-col items-center">
                        {isUploading ? (
                            <LoadingOtter message="Ollie is swimming through document files..." />
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-2xl mx-auto bg-white/10 text-white flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                </div>
                                <h3 className="text-lg font-bold tracking-wide">Drag & drop course materials</h3>
                            </>
                        )}
                    </div>
                </div>

                <div className="w-full flex flex-col mt-8">
                    <p className="text-[11px] uppercase font-bold tracking-widest text-forest-dark/40 mb-3 pl-1 select-none">Active Database Index ({materials.length} items)</p>
                    <div className="w-full bg-pebble-light/60 border border-forest-dark/5 shadow-xl rounded-[2rem] overflow-hidden">
                        {materials.length > 0 ? (
                            <div className="divide-y divide-forest-dark/5">
                                {materials.map((file) => (
                                    <div
                                        key={file.id}
                                        onClick={() => editingId !== file.id && window.open(file.url, '_blank')}
                                        className={`p-4 md:px-6 flex items-center justify-between text-sm transition group ${editingId === file.id ? 'bg-white/40' : 'hover:bg-white/30 cursor-pointer'}`}
                                    >
                                        <div className="flex items-center space-x-3.5 truncate flex-1 max-w-[75%]">
                                            <div className="p-2 rounded-lg bg-forest-dark/5 text-forest-dark/70 flex-shrink-0">
                                                {file.type === 'application/pdf' ? (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                )}
                                            </div>

                                            {editingId === file.id ? (
                                                <div className="flex items-center space-x-2 w-full" onClick={(e) => e.stopPropagation()}>
                                                    <input type="text" value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveNewName(file.id)} className="bg-white border text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-jade-accent w-full max-w-sm text-forest-dark" autoFocus />
                                                    <button onClick={() => saveNewName(file.id)} className="px-3 py-1.5 bg-forest-dark text-white text-xs font-bold rounded-lg transition hover:opacity-90 shadow-sm">Save</button>
                                                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-forest-dark/5 text-forest-dark text-xs font-bold rounded-lg transition hover:bg-forest-dark/10">Cancel</button>
                                                </div>
                                            ) : (
                                                <div className="truncate flex flex-col">
                                                    <span className="font-bold text-forest-dark truncate flex items-center pr-2">
                                                        <span className="truncate group-hover:text-jade-accent transition-colors duration-150">{file.name}</span>

                                                        <svg
                                                            onClick={(e) => startRenaming(e, file)}
                                                            className="ml-2.5 w-3.5 h-3.5 text-forest-dark/30 group-hover:text-jade-accent transition-all duration-200 transform hover:scale-125 cursor-pointer flex-shrink-0 min-w-[14px]"
                                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                                        >
                                                            <title>Rename Document File</title>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                                        </svg>
                                                    </span>
                                                    <span className="text-[10px] text-forest-dark/40 font-medium">{file.size} • Embedded on {file.uploaded_at}</span>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={(e) => handleRemoveFile(e, file)}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md transition duration-150 cursor-pointer flex-shrink-0 hover:bg-forest-dark/20 text-forest-dark/40 hover:text-forest-dark"
                                            title="Remove from tracking"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full min-h-[240px] flex flex-col items-center justify-center text-center select-none opacity-40">
                                <p className="text-sm font-bold">Your master reference database is currently empty.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}