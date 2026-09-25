export const CUTOFF_MINUTES_BEFORE_KICKOFF = 5

/**
 * Calculates strict prediction cutoff time (5 minutes before kickoff).
 */
export function getPredictionDeadline(kickoffTime: string | Date): Date {
  const kickoff = typeof kickoffTime === 'string' ? new Date(kickoffTime) : kickoffTime
  return new Date(kickoff.getTime() - CUTOFF_MINUTES_BEFORE_KICKOFF * 60 * 1000)
}

export type FixtureStatus =
  | 'upcoming'
  | 'scheduled'
  | 'live'
  | 'in_progress'
  | 'awaiting_result'
  | 'completed'
  | 'finalized'
  | 'postponed'
  | 'cancelled'

/**
 * Validates if fixture status permits predictions.
 * Only upcoming / scheduled matches that are not locked can accept predictions.
 */
export function isStatusPredictable(status: string): boolean {
  return status === 'upcoming' || status === 'scheduled'
}

/**
 * Checks whether predictions are locked based on kickoff time and authoritative server time.
 * Cutoff rule:
 * - Submissions made strictly before or exactly at cutoff (serverTime <= deadline) are ALLOWED.
 * - Submissions made strictly after cutoff (serverTime > deadline) are LOCKED.
 * - Non-upcoming fixtures (e.g. live, postponed, cancelled, completed) are LOCKED.
 */
export function isPredictionLocked(
  kickoffTime: string | Date,
  serverTime: string | Date = new Date(),
  status: string = 'upcoming'
): boolean {
  if (!isStatusPredictable(status)) {
    return true
  }

  const deadline = getPredictionDeadline(kickoffTime)
  const server = typeof serverTime === 'string' ? new Date(serverTime) : serverTime

  // Exactly at cutoff is allowed: server.getTime() <= deadline.getTime()
  return server.getTime() > deadline.getTime()
}

/**
 * Validates that submission is allowed, throwing an error otherwise.
 */
export function assertCanPredict(
  kickoffTime: string | Date,
  serverTime: string | Date = new Date(),
  status: string = 'upcoming'
): { allowed: boolean; deadline: Date } {
  const deadline = getPredictionDeadline(kickoffTime)
  const server = typeof serverTime === 'string' ? new Date(serverTime) : serverTime

  if (!isStatusPredictable(status)) {
    throw new Error(`Predictions are closed for this fixture (status: ${status}).`)
  }

  if (server.getTime() > deadline.getTime()) {
    throw new Error('Prediction deadline has passed. Predictions are locked.')
  }

  return { allowed: true, deadline }
}

/**
 * Normalizes fixture status strings to consistent set.
 */
export function normalizeFixtureStatus(
  status: string,
  kickoffTime: string | Date,
  finalized: boolean = false,
  currentTime: Date = new Date()
): FixtureStatus {
  if (finalized || status === 'completed' || status === 'finalized') {
    return 'finalized'
  }
  if (status === 'postponed') return 'postponed'
  if (status === 'cancelled') return 'cancelled'

  const kickoff = typeof kickoffTime === 'string' ? new Date(kickoffTime) : kickoffTime
  const msSinceKickoff = currentTime.getTime() - kickoff.getTime()

  // If match has passed regulation (~105 mins including half-time & injury time) and not yet finalized
  if (msSinceKickoff > 105 * 60 * 1000) {
    return 'awaiting_result'
  }
  if (status === 'live' || status === 'in_progress' || (msSinceKickoff >= 0 && msSinceKickoff <= 105 * 60 * 1000)) {
    return 'in_progress'
  }

  return 'scheduled'
}
