'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Header } from '@/components/Header'
import { Button } from '@/components/Buttons'
import { DashboardCard } from '@/components/DashboardCard'

interface GroupCount {
    group_id: string
    group_name: string
    member_count: number
}

export default function StudentGroupsPage() {
    const supabase = createClient()
    const router = useRouter()

    const [isLoading, setIsLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [currentGroupId, setCurrentGroupId] = useState<string | null>(null)
    const [currentGroupName, setCurrentGroupName] = useState<string | null>(null)
    
    const [groups, setGroups] = useState<GroupCount[]>([])
    const [newGroupName, setNewGroupName] = useState('')
    const [formError, setFormError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Fetch user authentication, current group state, and available groups list
    async function loadGroupData() {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) return router.push('/login')
            setUserId(user.id)

            // 1. Get user's current group membership status
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('group_id, role')
                .eq('id', user.id)
                .single()

            if (profileError) throw profileError

            if (profile?.role === 'INSTRUCTOR') {
                return router.push('/instructor')
            }

            setCurrentGroupId(profile?.group_id || null)

            const { data: viewData, error: viewError } = await supabase
                .from('group_member_counts')
                .select('*')
                .order('group_name', { ascending: true })

            if (viewError) throw viewError
            
            const groupList = viewData as GroupCount[] || []
            setGroups(groupList)

            if (profile?.group_id) {
                const match = groupList.find(g => g.group_id === profile.group_id)
                setCurrentGroupName(match ? match.group_name : 'Your Group')
            } else {
                setCurrentGroupName(null)
            }

            setIsLoading(false)
        } catch (err) {
            console.error('Error establishing group connection context:', err)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadGroupData()
    }, [router, supabase])

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault()
        const cleanName = newGroupName.trim()
        if (!cleanName || !userId) return

        setIsSubmitting(true)
        setFormError(null)

        try {
            const { data: newGroup, error: groupCreateError } = await supabase
                .from('groups')
                .insert({ name: cleanName })
                .select()
                .single()

            if (groupCreateError) {
                if (groupCreateError.code === '23505') {
                    setFormError('A group with this name already exists.')
                } else {
                    setFormError('Failed to create group. Please try again.')
                }
                setIsSubmitting(false)
                return
            }

            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({ group_id: newGroup.id })
                .eq('id', userId)

            if (profileUpdateError) throw profileUpdateError

            setNewGroupName('')
            router.push('/chat')
        } catch (err) {
            console.error('Group creation failure:', err)
            setFormError('An unexpected error occurred.')
            setIsSubmitting(false)
        }
    }

    // Handler to join an existing group row
    const handleJoinGroup = async (groupId: string) => {
        if (!userId) return
        setIsSubmitting(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ group_id: groupId })
                .eq('id', userId)

            if (error) throw error
            router.push('/chat')
        } catch (err) {
            console.error('Failed to attach profile to group target:', err)
            setIsSubmitting(false)
        }
    }

    // Handler to leave current group reference safely
    const handleLeaveGroup = async () => {
        if (!userId) return
        setIsSubmitting(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ group_id: null })
                .eq('id', userId)

            if (error) throw error
            await loadGroupData()
        } catch (err) {
            console.error('Failed to detach profile structure from current group:', err)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-sage-border font-abeezee text-forest-dark">
                <div className="text-sm font-bold tracking-wider animate-pulse">Syncing group coordinates...</div>
            </div>
        )
    }

    return (
        <div className="h-screen w-screen bg-sage-border font-abeezee text-forest-dark flex flex-col overflow-y-auto relative">
            <Header />

            <div className="w-full flex flex-col px-6 max-w-5xl mx-auto pb-12 pt-8">
                
                {/* Section Header Title block */}
                <div className="w-full text-left select-none pt-8 pb-8">
                    <h1 className="text-2xl md:text-3xl font-normal tracking-wide text-forest-dark">
                        Project Groups Workspace
                    </h1>
                    <p className="text-xs text-forest-dark/60 font-medium mt-1">
                        Join or set up a collaborative group context to synchronize anonymized telemetry data insights.
                    </p>
                </div>

                {currentGroupId && (
                    <div className="w-full bg-forest-dark text-pebble-light p-6 rounded-2xl mb-8 border border-forest-dark/20 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
                        <div>
                            <span className="bg-jade-accent text-forest-dark text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                                Active Membership
                            </span>
                            <h2 className="text-lg md:text-xl font-normal mt-1.5 opacity-95">
                                You are a member of <span className="font-bold text-white font-mono">#{currentGroupName}</span>
                            </h2>
                            <p className="text-xs text-pebble-light/60 mt-1">
                                Your chatbot metrics are actively aggregated alongside your group members for your instructor.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={() => router.push('/chat')}
                                className="text-xs font-bold bg-jade-accent text-white px-5 py-3 rounded-full shadow-md hover:bg-white hover:text-forest-dark transition active:scale-95 cursor-pointer whitespace-nowrap flex-1 md:flex-none text-center"
                            >
                                Go to Chat Workspace
                            </button>
                            <button
                                onClick={handleLeaveGroup}
                                disabled={isSubmitting}
                                className="text-xs font-bold bg-transparent text-pebble-light/70 border border-pebble-light/25 px-4 py-3 rounded-full hover:bg-red-700/20 hover:text-white hover:border-red-700/40 transition disabled:opacity-40 cursor-pointer whitespace-nowrap flex-1 md:flex-none text-center"
                            >
                                Leave Group
                            </button>
                        </div>
                    </div>
                )}

                <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
                    
                    <div className="md:col-span-2 w-full">
                        <DashboardCard
                            title="Form a New Group"
                            description="Establish a brand new group namespace. Once created, other students will see this group name in their feed to join."
                            icon={
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            }
                        >
                            <form onSubmit={handleCreateGroup} className="w-full flex flex-col space-y-3 pt-2">
                                <div className="w-full relative">
                                    <input
                                        type="text"
                                        maxLength={30}
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        placeholder="e.g., Team Alpha, Group 4"
                                        disabled={isSubmitting}
                                        className="w-full bg-pebble-light/60 text-sm text-forest-dark placeholder-slate-mist rounded-xl px-4 py-3 outline-none border border-forest-dark/10 shadow-xs transition focus:bg-white focus:ring-2 focus:ring-forest-dark/30 disabled:opacity-50"
                                    />
                                </div>
                                {formError && (
                                    <p className="text-xs text-red-700 font-semibold px-1">{formError}</p>
                                )}
                                <Button 
                                    idleLabel="Create and Join Group" 
                                    disabled={!newGroupName.trim() || isSubmitting} 
                                    className="w-full py-3 rounded-xl"
                                />
                            </form>
                        </DashboardCard>
                    </div>

                    <div className="md:col-span-3 w-full bg-pebble-light/30 border border-sage-border/60 rounded-2xl p-6 flex flex-col min-h-[350px]">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-forest-dark/80 mb-1 flex items-center gap-2">
                            <svg className="w-4 h-4 text-forest-dark/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Available Student Groups ({groups.length})
                        </h3>
                        <p className="text-[11px] text-forest-dark/50 font-medium mb-4">
                            Select an established collective block from the roster catalog stream below.
                        </p>

                        <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[400px] pr-1">
                            {groups.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-forest-dark/10 rounded-xl">
                                    <p className="text-xs text-forest-dark/50 italic font-medium">
                                        No groups have been created for this course yet.
                                    </p>
                                </div>
                            ) : (
                                groups.map((group) => {
                                    const isCurrent = group.group_id === currentGroupId
                                    return (
                                        <div
                                            key={group.group_id}
                                            className={`p-4 rounded-xl flex items-center justify-between gap-4 border transition-all ${isCurrent 
                                                ? 'bg-white border-jade-accent shadow-xs' 
                                                : 'bg-pebble-light/50 border-sage-border hover:bg-pebble-light hover:border-forest-dark/10'
                                            }`}
                                        >
                                            <div className="truncate">
                                                <p className="text-sm font-bold text-forest-dark truncate font-mono">
                                                    #{group.group_name}
                                                </p>
                                                <p className="text-xs text-forest-dark/60 font-medium mt-0.5">
                                                    {group.member_count} {group.member_count === 1 ? 'student' : 'students'} active
                                                </p>
                                            </div>

                                            {isCurrent ? (
                                                <span className="text-xs font-bold text-jade-accent bg-jade-accent/10 px-3 py-1.5 rounded-lg border border-jade-accent/20 select-none">
                                                    Joined
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleJoinGroup(group.group_id)}
                                                    disabled={isSubmitting}
                                                    className="text-xs font-bold bg-forest-dark text-white hover:bg-jade-accent px-4 py-2 rounded-lg transition disabled:opacity-40 cursor-pointer shadow-xs whitespace-nowrap"
                                                >
                                                    Join
                                                </button>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    )
}