export interface PredictionScoringResult {
  points: number
  reason: 'Exact Score' | 'Correct Outcome' | 'Incorrect' | 'Cancelled Match' | 'Postponed'
  isExact: boolean
  isOutcome: boolean
}

/**
 * Computes points for a single prediction given actual full-time match scores.
 * Rule:
 * - Exact Score: 5 Points (also counts toward member's 'correct outcomes' statistic)
 * - Correct Outcome (Win/Draw/Loss): 3 Points
 * - Incorrect: 0 Points
 */
export function computePredictionPoints(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number
): PredictionScoringResult {
  if (predHome === realHome && predAway === realAway) {
    return {
      points: 5,
      reason: 'Exact Score',
      isExact: true,
      isOutcome: true, // Exact score also counts as a correct outcome
    }
  }

  const realOutcome = realHome > realAway ? 'home' : realHome < realAway ? 'away' : 'draw'
  const predOutcome = predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw'

  if (realOutcome === predOutcome) {
    return {
      points: 3,
      reason: 'Correct Outcome',
      isExact: false,
      isOutcome: true,
    }
  }

  return {
    points: 0,
    reason: 'Incorrect',
    isExact: false,
    isOutcome: false,
  }
}

export interface UserLeaderboardEntry {
  id: string
  name: string
  points: number
  exact: number
  outcome: number
  rank: number
  isTied: boolean
  sharedRankDisplay: string
}

export interface RawPrediction {
  id?: string
  user_id: string
  fixture_id: string
  home_score: number
  away_score: number
  points_awarded?: number | null
  updated_at?: string
}

export interface RawFixture {
  id: string
  status: string
  finalized?: boolean
  home_score?: number | null
  away_score?: number | null
  updated_at?: string
}

export interface RawProfile {
  id: string
  display_name: string
  status?: string
}

/**
 * Calculates leaderboard rankings with authoritative tie-breakers and shared rank assignment.
 * Tie breakers:
 * 1. Total Points (descending)
 * 2. Exact Scores count (descending)
 * 3. Correct Outcomes count (descending) - note: exact scores also count as correct outcomes
 * If still tied, members share the rank (e.g. 1, 2, 2, 4).
 */
export function calculateLeaderboard(
  profiles: RawProfile[],
  predictions: RawPrediction[],
  fixtures: RawFixture[] = []
): {
  leaderboard: UserLeaderboardEntry[]
  lastUpdatedAt: string | null
} {
  const fixtureMap = new Map<string, RawFixture>()
  let latestUpdateMs = 0

  fixtures.forEach((f) => {
    fixtureMap.set(f.id, f)
    if (f.updated_at) {
      const ms = new Date(f.updated_at).getTime()
      if (!isNaN(ms) && ms > latestUpdateMs) latestUpdateMs = ms
    }
  })

  const userStats = new Map<
    string,
    { id: string; name: string; points: number; exact: number; outcome: number }
  >()

  // Initialize all active/approved users
  profiles.forEach((p) => {
    userStats.set(p.id, {
      id: p.id,
      name: p.display_name || 'Member',
      points: 0,
      exact: 0,
      outcome: 0,
    })
  })

  // Process predictions
  predictions.forEach((pred) => {
    if (pred.updated_at) {
      const ms = new Date(pred.updated_at).getTime()
      if (!isNaN(ms) && ms > latestUpdateMs) latestUpdateMs = ms
    }

    const fixture = fixtureMap.get(pred.fixture_id)

    // A postponed fixture should receive no points while awaiting a valid final result.
    if (fixture && fixture.status === 'postponed' && !fixture.finalized) {
      return
    }

    // Cancelled fixture receives 0 points
    if (fixture && fixture.status === 'cancelled') {
      return
    }

    if (!userStats.has(pred.user_id)) {
      userStats.set(pred.user_id, {
        id: pred.user_id,
        name: 'Member',
        points: 0,
        exact: 0,
        outcome: 0,
      })
    }

    const user = userStats.get(pred.user_id)!

    if (pred.points_awarded !== null && pred.points_awarded !== undefined) {
      user.points += pred.points_awarded
      if (pred.points_awarded === 5) {
        user.exact += 1
        user.outcome += 1 // Exact score also counts towards correct outcomes
      } else if (pred.points_awarded === 3) {
        user.outcome += 1
      }
    }
  })

  // Sort descending by: Points -> Exact -> Outcome
  const sorted = Array.from(userStats.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.exact !== a.exact) return b.exact - a.exact
    if (b.outcome !== a.outcome) return b.outcome - a.outcome
    return a.name.localeCompare(b.name)
  })

  // Calculate shared ranks
  const ranked: UserLeaderboardEntry[] = []
  let currentRank = 1

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]
    if (i > 0) {
      const prev = sorted[i - 1]
      const isIdentical =
        current.points === prev.points &&
        current.exact === prev.exact &&
        current.outcome === prev.outcome

      if (!isIdentical) {
        currentRank = i + 1
      }
    }

    // Check if tied with previous or next
    const tiedWithPrev =
      i > 0 &&
      sorted[i - 1].points === current.points &&
      sorted[i - 1].exact === current.exact &&
      sorted[i - 1].outcome === current.outcome
    const tiedWithNext =
      i < sorted.length - 1 &&
      sorted[i + 1].points === current.points &&
      sorted[i + 1].exact === current.exact &&
      sorted[i + 1].outcome === current.outcome
    const isTied = tiedWithPrev || tiedWithNext

    ranked.push({
      ...current,
      rank: currentRank,
      isTied,
      sharedRankDisplay: isTied ? `=${currentRank}` : `#${currentRank}`,
    })
  }

  return {
    leaderboard: ranked,
    lastUpdatedAt: latestUpdateMs > 0 ? new Date(latestUpdateMs).toISOString() : null,
  }
}

export interface PreviewImpactItem {
  userId: string
  userName: string
  predictedScore: string
  oldPoints: number
  newPoints: number
  pointsDelta: number
  reason: string
  currentRank: number
  projectedRank: number
  rankDelta: number // positive = improved rank
}

/**
 * Previews points and rank shifts before an admin finalizes or corrects a score.
 */
export function previewResultImpact(
  fixtureId: string,
  newHomeScore: number,
  newAwayScore: number,
  profiles: RawProfile[],
  allPredictions: RawPrediction[],
  fixtures: RawFixture[]
): {
  impacts: PreviewImpactItem[]
  currentLeaderboard: UserLeaderboardEntry[]
  projectedLeaderboard: UserLeaderboardEntry[]
} {
  // Current leaderboard
  const { leaderboard: currentLeaderboard } = calculateLeaderboard(
    profiles,
    allPredictions,
    fixtures
  )
  const currentRankMap = new Map<string, number>()
  currentLeaderboard.forEach((e) => currentRankMap.set(e.id, e.rank))

  // Simulate new predictions
  const simulatedPredictions = allPredictions.map((p) => {
    if (p.fixture_id === fixtureId) {
      const scoring = computePredictionPoints(
        p.home_score,
        p.away_score,
        newHomeScore,
        newAwayScore
      )
      return {
        ...p,
        points_awarded: scoring.points,
        points_reason: scoring.reason,
      }
    }
    return p
  })

  // Simulated fixture
  const simulatedFixtures = fixtures.map((f) => {
    if (f.id === fixtureId) {
      return {
        ...f,
        home_score: newHomeScore,
        away_score: newAwayScore,
        status: 'completed',
        finalized: true,
      }
    }
    return f
  })

  const { leaderboard: projectedLeaderboard } = calculateLeaderboard(
    profiles,
    simulatedPredictions,
    simulatedFixtures
  )
  const projectedRankMap = new Map<string, number>()
  projectedLeaderboard.forEach((e) => projectedRankMap.set(e.id, e.rank))

  // Find impact for all users who predicted this fixture
  const fixturePredictions = allPredictions.filter((p) => p.fixture_id === fixtureId)
  const profileMap = new Map<string, string>()
  profiles.forEach((p) => profileMap.set(p.id, p.display_name))

  const impacts: PreviewImpactItem[] = fixturePredictions.map((pred) => {
    const oldPoints = pred.points_awarded ?? 0
    const newScoring = computePredictionPoints(
      pred.home_score,
      pred.away_score,
      newHomeScore,
      newAwayScore
    )
    const newPoints = newScoring.points
    const cRank = currentRankMap.get(pred.user_id) ?? currentLeaderboard.length
    const pRank = projectedRankMap.get(pred.user_id) ?? projectedLeaderboard.length

    return {
      userId: pred.user_id,
      userName: profileMap.get(pred.user_id) || 'Member',
      predictedScore: `${pred.home_score} - ${pred.away_score}`,
      oldPoints,
      newPoints,
      pointsDelta: newPoints - oldPoints,
      reason: newScoring.reason,
      currentRank: cRank,
      projectedRank: pRank,
      rankDelta: cRank - pRank, // e.g. from 3 to 1 is +2 improvement
    }
  })

  // Sort impact by highest points delta descending
  impacts.sort((a, b) => b.pointsDelta - a.pointsDelta)

  return {
    impacts,
    currentLeaderboard,
    projectedLeaderboard,
  }
}
