'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isPredictionLocked, getPredictionDeadline } from '@/lib/deadline'

export async function savePrediction(fixtureId: string, homeScore: number, awayScore: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Unauthorized: Please sign in' }

  // Check user approval status
  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single()

  if (profile?.status !== 'approved') {
    return { error: 'Account not approved yet. Only approved members can predict.' }
  }

  // Validate non-negative score inputs
  if (
    isNaN(homeScore) ||
    isNaN(awayScore) ||
    homeScore < 0 ||
    awayScore < 0 ||
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore)
  ) {
    return { error: 'Scores must be non-negative whole numbers (0 or greater).' }
  }

  // Fetch fixture with server timestamp
  const { data: fixture } = await supabase
    .from('fixtures')
    .select('kickoff_time, status, finalized')
    .eq('id', fixtureId)
    .single()
  
  if (!fixture) return { error: 'Match fixture not found.' }

  if (fixture.finalized || fixture.status !== 'upcoming') {
    return { error: `Predictions are closed for this match (status: ${fixture.status}).` }
  }

  const serverTime = new Date()
  const locked = isPredictionLocked(fixture.kickoff_time, serverTime, fixture.status)

  if (locked) {
    return { error: 'Prediction deadline has passed. Predictions are locked for this fixture.' }
  }

  // Atomic upsert enforces one prediction per user per fixture
  const { error } = await supabase
    .from('predictions')
    .upsert({
      user_id: user.id,
      fixture_id: fixtureId,
      home_score: homeScore,
      away_score: awayScore,
      updated_at: serverTime.toISOString(),
    }, { onConflict: 'user_id, fixture_id' })

  if (error) {
    console.error('Error saving prediction:', error)
    return { error: error.message || 'Database error occurred while saving prediction.' }
  }

  revalidatePath(`/matches/${fixtureId}`)
  revalidatePath('/matches')
  revalidatePath('/home')
  revalidatePath('/profile')
  return { success: true }
}
