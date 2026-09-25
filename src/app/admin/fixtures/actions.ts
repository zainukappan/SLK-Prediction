'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAdminAction } from '@/lib/admin-audit'

export async function createFixture(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const round_id = formData.get('round_id') as string
  const home_team_id = formData.get('home_team_id') as string
  const away_team_id = formData.get('away_team_id') as string
  const kickoff_time = formData.get('kickoff_time') as string

  if (!round_id || !home_team_id || !away_team_id || !kickoff_time) {
    return { error: 'All fields are required' }
  }

  const dateObj = new Date(kickoff_time)
  if (isNaN(dateObj.getTime())) {
    return { error: 'Invalid kickoff date/time format' }
  }

  const { data: inserted, error } = await supabase.from('fixtures').insert({
    round_id,
    home_team_id,
    away_team_id,
    kickoff_time: dateObj.toISOString(),
    status: 'upcoming',
    finalized: false,
  }).select().single()

  if (error) {
    console.error('Create fixture error', error)
    return { error: error.message }
  }

  await logAdminAction({
    admin_id: user.id,
    action: 'fixture_created',
    target_type: 'fixture',
    target_id: inserted?.id,
    new_state: inserted,
  })

  revalidatePath('/admin/fixtures')
  revalidatePath('/admin')
  revalidatePath('/matches')
  revalidatePath('/home')
  return { success: true }
}

export async function updateFixtureSchedule(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const fixtureId = formData.get('fixtureId') as string
  const newKickoff = formData.get('newKickoffTime') as string
  const reason = (formData.get('rescheduleReason') as string || '').trim()

  if (!fixtureId || !newKickoff) {
    return { error: 'Fixture ID and new kickoff time are required' }
  }

  const newDate = new Date(newKickoff)
  if (isNaN(newDate.getTime())) {
    return { error: 'Invalid date/time format' }
  }

  // Get current fixture
  const { data: currentFixture } = await supabase
    .from('fixtures')
    .select('*')
    .eq('id', fixtureId)
    .single()

  if (!currentFixture) return { error: 'Fixture not found' }

  const originalKickoff = currentFixture.original_kickoff_time || currentFixture.kickoff_time

  const { error } = await supabase
    .from('fixtures')
    .update({
      kickoff_time: newDate.toISOString(),
      original_kickoff_time: originalKickoff,
      is_rescheduled: true,
      rescheduled_reason: reason || 'Kickoff rescheduled by organizer',
      updated_at: new Date().toISOString(),
    })
    .eq('id', fixtureId)

  if (error) {
    console.error('Update schedule error', error)
    return { error: error.message }
  }

  // Log private admin audit
  await logAdminAction({
    admin_id: user.id,
    action: 'fixture_rescheduled',
    target_type: 'fixture',
    target_id: fixtureId,
    reason: reason || 'Schedule adjusted',
    previous_state: { kickoff_time: currentFixture.kickoff_time },
    new_state: { kickoff_time: newDate.toISOString(), original_kickoff_time: originalKickoff },
  })

  revalidatePath('/admin/fixtures')
  revalidatePath('/admin')
  revalidatePath('/matches')
  revalidatePath(`/matches/${fixtureId}`)
  revalidatePath('/home')
  return { success: true }
}

export async function deleteFixture(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data: prev } = await supabase.from('fixtures').select('*').eq('id', id).single()

  const { error } = await supabase.from('fixtures').delete().eq('id', id)
  if (error) return { error: error.message }

  await logAdminAction({
    admin_id: user.id,
    action: 'fixture_deleted',
    target_type: 'fixture',
    target_id: id,
    previous_state: prev,
  })
  
  revalidatePath('/admin/fixtures')
  revalidatePath('/admin')
  revalidatePath('/matches')
  revalidatePath('/home')
  return { success: true }
}

export async function saveTeam(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const id = formData.get('teamId') as string | null
  const name = (formData.get('name') as string || '').trim()
  const name_ml = (formData.get('name_ml') as string || '').trim()
  const short_name = (formData.get('short_name') as string || '').trim().toUpperCase()
  const short_name_ml = (formData.get('short_name_ml') as string || '').trim()
  const badge_url = (formData.get('badge_url') as string || '').trim()

  if (!name || !short_name) {
    return { error: 'English team name and short name are required' }
  }

  const payload: any = {
    name,
    name_ml: name_ml || null,
    short_name,
    short_name_ml: short_name_ml || null,
    badge_url: badge_url || null,
    logo_url: badge_url || null,
  }

  let error
  if (id) {
    const res = await supabase.from('teams').update(payload).eq('id', id)
    error = res.error
  } else {
    const res = await supabase.from('teams').insert(payload)
    error = res.error
  }

  if (error) {
    return { error: error.message }
  }

  await logAdminAction({
    admin_id: user.id,
    action: id ? 'team_updated' : 'team_created',
    target_type: 'team',
    target_id: id || undefined,
    new_state: payload,
  })

  revalidatePath('/admin/fixtures')
  revalidatePath('/matches')
  revalidatePath('/home')
  return { success: true }
}

export async function saveRound(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const id = formData.get('roundId') as string | null
  const name = (formData.get('name') as string || '').trim()
  const name_ml = (formData.get('name_ml') as string || '').trim()
  const round_order = parseInt(formData.get('round_order') as string || '1')

  if (!name || isNaN(round_order)) {
    return { error: 'Round name and order number are required' }
  }

  const payload: any = {
    name,
    name_ml: name_ml || null,
    round_order,
  }

  let error
  if (id) {
    const res = await supabase.from('rounds').update(payload).eq('id', id)
    error = res.error
  } else {
    const res = await supabase.from('rounds').insert(payload)
    error = res.error
  }

  if (error) return { error: error.message }

  await logAdminAction({
    admin_id: user.id,
    action: id ? 'round_updated' : 'round_created',
    target_type: 'round',
    target_id: id || undefined,
    new_state: payload,
  })

  revalidatePath('/admin/fixtures')
  return { success: true }
}
