'use server'

import { createClient } from '@/lib/supabase/server'
import { computePredictionPoints, previewResultImpact, RawFixture, RawPrediction, RawProfile } from '@/lib/scoring'
import { logAdminAction } from '@/lib/admin-audit'
import { revalidatePath } from 'next/cache'

export async function getResultPreviewAction(fixtureId: string, homeScore: number, awayScore: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  if (homeScore < 0 || awayScore < 0 || isNaN(homeScore) || isNaN(awayScore)) {
    return { error: 'Scores must be non-negative integers' }
  }

  const { data: profiles } = await supabase.from('profiles').select('id, display_name, status')
  const { data: predictions } = await supabase.from('predictions').select('*')
  const { data: fixtures } = await supabase.from('fixtures').select('*')

  const impactData = previewResultImpact(
    fixtureId,
    homeScore,
    awayScore,
    (profiles as RawProfile[]) || [],
    (predictions as RawPrediction[]) || [],
    (fixtures as RawFixture[]) || []
  )

  return { success: true, ...impactData }
}

export async function finalizeOrCorrectResult(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const fixtureId = formData.get('fixtureId') as string
  const homeScoreStr = formData.get('homeScore') as string
  const awayScoreStr = formData.get('awayScore') as string
  const status = formData.get('status') as string
  const reason = (formData.get('reason') as string || '').trim()

  if (!fixtureId || !status) {
    return { error: 'Fixture and status are required' }
  }

  const { data: currentFixture } = await supabase
    .from('fixtures')
    .select('*')
    .eq('id', fixtureId)
    .single()

  if (!currentFixture) return { error: 'Fixture not found' }

  const wasFinalized = currentFixture.finalized

  // If already finalized, require reason for correction
  if (wasFinalized && !reason) {
    return { error: 'A reason is required to correct an already finalized match result.' }
  }

  const isCompleted = status === 'completed'
  const isPostponed = status === 'postponed'
  const isCancelled = status === 'cancelled'

  let homeScore = currentFixture.home_score
  let awayScore = currentFixture.away_score

  if (homeScoreStr !== '' && homeScoreStr !== null && !isNaN(parseInt(homeScoreStr))) {
    homeScore = parseInt(homeScoreStr)
    if (homeScore < 0) return { error: 'Home score cannot be negative' }
  }

  if (awayScoreStr !== '' && awayScoreStr !== null && !isNaN(parseInt(awayScoreStr))) {
    awayScore = parseInt(awayScoreStr)
    if (awayScore < 0) return { error: 'Away score cannot be negative' }
  }

  // Update fixture
  const fixtureUpdatePayload: any = {
    status,
    finalized: isCompleted,
    home_score: isCompleted ? homeScore : (isCancelled ? null : homeScore),
    away_score: isCompleted ? awayScore : (isCancelled ? null : awayScore),
    updated_at: new Date().toISOString(),
  }

  const { error: fixtureError } = await supabase
    .from('fixtures')
    .update(fixtureUpdatePayload)
    .eq('id', fixtureId)

  if (fixtureError) {
    return { error: fixtureError.message }
  }

  // Handle predictions scoring
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('fixture_id', fixtureId)

  if (predictions && predictions.length > 0) {
    for (const pred of predictions) {
      let pointsAwarded: number | null = null
      let pointsReason: string | null = null

      if (isCompleted && homeScore !== null && awayScore !== null) {
        const res = computePredictionPoints(pred.home_score, pred.away_score, homeScore, awayScore)
        pointsAwarded = res.points
        pointsReason = res.reason
      } else if (isPostponed) {
        // A postponed fixture should receive no points while awaiting a valid final result.
        pointsAwarded = null
        pointsReason = 'Postponed'
      } else if (isCancelled) {
        // A cancelled fixture should receive no points.
        pointsAwarded = 0
        pointsReason = 'Cancelled Match'
      }

      await supabase
        .from('predictions')
        .update({
          points_awarded: pointsAwarded,
          points_reason: pointsReason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pred.id)
    }
  }

  // Log in private admin audit history
  await logAdminAction({
    admin_id: user.id,
    action: wasFinalized ? 'result_corrected' : 'result_finalized',
    target_type: 'fixture',
    target_id: fixtureId,
    reason: reason || (wasFinalized ? 'Correction' : 'Finalized match result'),
    previous_state: {
      home_score: currentFixture.home_score,
      away_score: currentFixture.away_score,
      status: currentFixture.status,
      finalized: currentFixture.finalized,
    },
    new_state: fixtureUpdatePayload,
  })

  revalidatePath('/admin/results')
  revalidatePath('/admin')
  revalidatePath('/rank')
  revalidatePath('/matches')
  revalidatePath('/home')
  return { success: true }
}
