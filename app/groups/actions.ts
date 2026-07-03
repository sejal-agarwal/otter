'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function joinGroupAction(groupId: string | null, userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ group_id: groupId })
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/chat')
  revalidatePath('/groups')

  return { success: true }
}