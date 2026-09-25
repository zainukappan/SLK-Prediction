import { test } from 'node:test'
import assert from 'node:assert/strict'
import { 
  computePredictionPoints, 
  calculateLeaderboard, 
  previewResultImpact 
} from '../src/lib/scoring.ts'

test('Scoring: Exact score gives 5 pts and counts as BOTH exact score and correct outcome', () => {
  // Real match ended 2-1
  const result = computePredictionPoints(2, 1, 2, 1)

  assert.equal(result.points, 5)
  assert.equal(result.reason, 'Exact Score')
  assert.equal(result.isExact, true)
  assert.equal(result.isOutcome, true, 'Exact-score prediction MUST also count toward correct outcomes')
})

test('Scoring: Non-exact with correct outcome gives 3 pts and counts toward correct outcomes', () => {
  // Real match ended 2-1 (Home Win). User predicted 1-0 (Home Win).
  const result = computePredictionPoints(1, 0, 2, 1)

  assert.equal(result.points, 3)
  assert.equal(result.reason, 'Correct Outcome')
  assert.equal(result.isExact, false)
  assert.equal(result.isOutcome, true)
})

test('Scoring: Incorrect outcome gives 0 pts and neither exact nor outcome', () => {
  // Real match ended 2-1 (Home Win). User predicted 1-1 (Draw) or 0-2 (Away Win).
  const drawPred = computePredictionPoints(1, 1, 2, 1)
  assert.equal(drawPred.points, 0)
  assert.equal(drawPred.isExact, false)
  assert.equal(drawPred.isOutcome, false)

  const awayPred = computePredictionPoints(0, 2, 2, 1)
  assert.equal(awayPred.points, 0)
  assert.equal(awayPred.isExact, false)
  assert.equal(awayPred.isOutcome, false)
})

test('Postponed and cancelled fixtures scoring behavior', () => {
  const profiles = [
    { id: 'user-1', display_name: 'Zain' },
    { id: 'user-2', display_name: 'Rahman' },
  ]

  const fixtures = [
    { id: 'fix-1', status: 'postponed', finalized: false }, // Postponed awaiting result
    { id: 'fix-2', status: 'cancelled', finalized: true },  // Cancelled match
  ]

  const predictions = [
    { id: 'p1', user_id: 'user-1', fixture_id: 'fix-1', home_score: 2, away_score: 1, points_awarded: 5 },
    { id: 'p2', user_id: 'user-2', fixture_id: 'fix-2', home_score: 1, away_score: 0, points_awarded: 0 },
  ]

  const { leaderboard } = calculateLeaderboard(profiles, predictions, fixtures)

  // Both should have 0 points: postponed fixture points are ignored while awaiting final result
  const user1 = leaderboard.find((u) => u.id === 'user-1')!
  const user2 = leaderboard.find((u) => u.id === 'user-2')!

  assert.equal(user1.points, 0, 'Postponed fixture must receive no points while awaiting valid result')
  assert.equal(user2.points, 0, 'Cancelled fixture must receive no points')
})

test('Leaderboard: Shared rank when tied after points, exact scores, and correct outcomes', () => {
  const profiles = [
    { id: 'user-a', display_name: 'Member A' },
    { id: 'user-b', display_name: 'Member B' },
    { id: 'user-c', display_name: 'Member C' },
    { id: 'user-d', display_name: 'Member D' },
  ]

  // Scenario:
  // Member A: 10 pts (2 exact: 2 exact, 2 outcomes)
  // Member B: 8 pts (1 exact, 1 correct outcome: 1 exact, 2 outcomes)
  // Member C: 8 pts (1 exact, 1 correct outcome: 1 exact, 2 outcomes) -> EXACT TIE WITH B!
  // Member D: 3 pts (0 exact, 1 correct outcome)
  const predictions = [
    // Member A
    { user_id: 'user-a', fixture_id: 'f1', home_score: 2, away_score: 1, points_awarded: 5 },
    { user_id: 'user-a', fixture_id: 'f2', home_score: 1, away_score: 0, points_awarded: 5 },

    // Member B
    { user_id: 'user-b', fixture_id: 'f1', home_score: 2, away_score: 1, points_awarded: 5 },
    { user_id: 'user-b', fixture_id: 'f2', home_score: 2, away_score: 0, points_awarded: 3 },

    // Member C (same as B)
    { user_id: 'user-c', fixture_id: 'f1', home_score: 2, away_score: 1, points_awarded: 5 },
    { user_id: 'user-c', fixture_id: 'f2', home_score: 3, away_score: 1, points_awarded: 3 },

    // Member D
    { user_id: 'user-d', fixture_id: 'f1', home_score: 3, away_score: 0, points_awarded: 3 },
  ]

  const { leaderboard } = calculateLeaderboard(profiles, predictions, [])

  const a = leaderboard.find((u) => u.id === 'user-a')!
  const b = leaderboard.find((u) => u.id === 'user-b')!
  const c = leaderboard.find((u) => u.id === 'user-c')!
  const d = leaderboard.find((u) => u.id === 'user-d')!

  // Check stats
  assert.equal(a.points, 10)
  assert.equal(a.exact, 2)
  assert.equal(a.outcome, 2)
  assert.equal(a.rank, 1)
  assert.equal(a.isTied, false)
  assert.equal(a.sharedRankDisplay, '#1')

  // B and C are tied
  assert.equal(b.points, 8)
  assert.equal(b.exact, 1)
  assert.equal(b.outcome, 2, 'Exact score (5) + correct outcome (3) = 2 outcomes')
  assert.equal(b.rank, 2)
  assert.equal(b.isTied, true)
  assert.equal(b.sharedRankDisplay, '=2')

  assert.equal(c.points, 8)
  assert.equal(c.exact, 1)
  assert.equal(c.outcome, 2)
  assert.equal(c.rank, 2)
  assert.equal(c.isTied, true)
  assert.equal(c.sharedRankDisplay, '=2')

  // D takes rank 4 (1, 2, 2, 4)
  assert.equal(d.points, 3)
  assert.equal(d.rank, 4, 'Rank should skip to 4 following a 2-way tie at rank 2')
  assert.equal(d.isTied, false)
  assert.equal(d.sharedRankDisplay, '#4')
})

test('Score correction & preview: recomputes points and standings shift', () => {
  const profiles = [
    { id: 'u1', display_name: 'Alice' },
    { id: 'u2', display_name: 'Bob' },
  ]

  const fixtures = [
    { id: 'f1', home_score: 1, away_score: 0, status: 'completed', finalized: true },
  ]

  // Currently: Real score was 1-0 (Home Win)
  // Alice predicted 1-0 (Exact -> 5 pts)
  // Bob predicted 2-0 (Outcome -> 3 pts)
  const predictions = [
    { user_id: 'u1', fixture_id: 'f1', home_score: 1, away_score: 0, points_awarded: 5 },
    { user_id: 'u2', fixture_id: 'f1', home_score: 2, away_score: 0, points_awarded: 3 },
  ]

  // Admin previews correcting score to 2-0:
  // Now Alice (1-0) will have 3 pts (Outcome)
  // Bob (2-0) will have 5 pts (Exact)
  const preview = previewResultImpact(
    'f1',
    2, // corrected home score
    0, // away score
    profiles,
    predictions,
    fixtures
  )

  const aliceImpact = preview.impacts.find((i) => i.userId === 'u1')!
  const bobImpact = preview.impacts.find((i) => i.userId === 'u2')!

  assert.equal(aliceImpact.oldPoints, 5)
  assert.equal(aliceImpact.newPoints, 3)
  assert.equal(aliceImpact.pointsDelta, -2)

  assert.equal(bobImpact.oldPoints, 3)
  assert.equal(bobImpact.newPoints, 5)
  assert.equal(bobImpact.pointsDelta, 2)
  assert.equal(bobImpact.projectedRank, 1, 'Bob should now rank #1')
})
