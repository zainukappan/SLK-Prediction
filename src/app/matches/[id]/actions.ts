'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function savePrediction(fixtureId: string, homeScore: number, awayScore: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Unauthorized' }

  // Check deadline
  const { data: fixture } = await supabase.from('fixtures').select('kickoff_time, status').eq('id', fixtureId).single()
  
  if (!fixture || fixture.status !== 'upcoming') return { error: 'Match is not upcoming' }

  const deadline = new Date(new Date(fixture.kickoff_time).getTime() - 5 * 60000)
  if (new Date() > deadline) return { error: 'Deadline passed' }

  const { error } = await supabase
    .from('predictions')
    .upsert({
      user_id: user.id,
      fixture_id: fixtureId,
      home_score: homeScore,
      away_score: awayScore,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, fixture_id' })

  if (error) {
    console.error(error)
    return { error: 'Database error' }
  }

  revalidatePath(`/matches/${fixtureId}`)
  revalidatePath('/matches')
  revalidatePath('/home')
  return { success: true }
}
