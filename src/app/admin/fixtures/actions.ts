'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createFixture(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const round_id = formData.get('round_id') as string
  const home_team_id = formData.get('home_team_id') as string
  const away_team_id = formData.get('away_team_id') as string
  const kickoff_time = formData.get('kickoff_time') as string // Should be local datetime input

  if (!round_id || !home_team_id || !away_team_id || !kickoff_time) {
    return { error: 'All fields are required' }
  }

  // Convert to ISO string explicitly
  const dateObj = new Date(kickoff_time)

  const { error } = await supabase.from('fixtures').insert({
    round_id,
    home_team_id,
    away_team_id,
    kickoff_time: dateObj.toISOString(),
    status: 'upcoming'
  })

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  revalidatePath('/admin/fixtures')
  revalidatePath('/matches')
  revalidatePath('/home')
  return { success: true }
}

export async function deleteFixture(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  await supabase.from('fixtures').delete().eq('id', id)
  
  revalidatePath('/admin/fixtures')
  revalidatePath('/matches')
  revalidatePath('/home')
  return { success: true }
}
