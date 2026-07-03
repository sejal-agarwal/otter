'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function login(state: any, formData: FormData) {
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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, group_id')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Failed to fetch user profile.' }
  }

  const userRole = profile.role.toUpperCase()

  let redirectTo = '/chat'

  if (userRole === 'INSTRUCTOR') {
    redirectTo = '/instructor'
  } else if (!profile.group_id) {
    redirectTo = '/groups'
  }

  return {
    success: true,
    redirectTo
  }
}

export async function signup(state: any, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password || !name) {
    return { error: 'Please fill in all fields.' }
  }

  const cleanEmail = email.trim().toLowerCase()

  const { error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: { name },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, redirectTo: '/groups' }
}