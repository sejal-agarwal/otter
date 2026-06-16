'use server'

import { createClient } from '@/utils/supabase/server'

export async function login(_state: any, formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Please fill in all fields.' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
    })

    if (error) {
        return { error: error.message }
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
    
    if (profileError || !profile) {
        return { error: 'Failed to fetch user profile.' }
    }

    return {
        success: true,
        redirectTo: profile.role === 'INSTRUCTOR' ? '/instructor' : '/chat'
    }
}

export async function signup(_state: any, formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    if (!email || !password || !name) {
        return { error: 'Please fill in all fields.' }
    }

    const cleanEmail = email.trim().toLowerCase()

    if(!cleanEmail.endsWith('@uwaterloo.ca')) {
        return { error: 'Please use a valid @uwaterloo.ca email address.' }
    }

    const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
            data: {
                name }
        }
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, redirectTo: '/chat'}
}