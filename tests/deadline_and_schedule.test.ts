import { test } from 'node:test'
import assert from 'node:assert/strict'
import { 
  getPredictionDeadline, 
  isPredictionLocked, 
  assertCanPredict, 
  normalizeFixtureStatus 
} from '../src/lib/deadline.ts'

test('Deadline: 5 minutes before scheduled kickoff', () => {
  const kickoff = new Date('2026-10-15T19:30:00.000Z')
  const expectedDeadline = new Date('2026-10-15T19:25:00.000Z')

  assert.equal(getPredictionDeadline(kickoff).toISOString(), expectedDeadline.toISOString())
})

test('Deadline cutoff checks: immediately before, exactly at, and after cutoff', () => {
  const kickoff = new Date('2026-10-15T20:00:00.000Z')
  const cutoff = new Date('2026-10-15T19:55:00.000Z')

  // 1. Immediately before cutoff (e.g. 1 second before) -> ALLOWED (not locked)
  const immediatelyBefore = new Date(cutoff.getTime() - 1000)
  assert.equal(isPredictionLocked(kickoff, immediatelyBefore, 'upcoming'), false)
  assert.doesNotThrow(() => assertCanPredict(kickoff, immediatelyBefore, 'upcoming'))

  // 2. Exactly at cutoff -> ALLOWED (not locked)
  const exactlyAt = new Date(cutoff.getTime())
  assert.equal(isPredictionLocked(kickoff, exactlyAt, 'upcoming'), false)
  assert.doesNotThrow(() => assertCanPredict(kickoff, exactlyAt, 'upcoming'))

  // 3. Immediately after cutoff (1 millisecond after) -> LOCKED / REJECTED
  const immediatelyAfterMs = new Date(cutoff.getTime() + 1)
  assert.equal(isPredictionLocked(kickoff, immediatelyAfterMs, 'upcoming'), true)
  assert.throws(
    () => assertCanPredict(kickoff, immediatelyAfterMs, 'upcoming'),
    /Prediction deadline has passed/
  )

  // 4. One minute after cutoff -> LOCKED / REJECTED
  const afterCutoff = new Date(cutoff.getTime() + 60000)
  assert.equal(isPredictionLocked(kickoff, afterCutoff, 'upcoming'), true)
  assert.throws(
    () => assertCanPredict(kickoff, afterCutoff, 'upcoming'),
    /Prediction deadline has passed/
  )
})

test('Fixture rescheduled earlier: deadline shifts earlier, past new deadline locked', () => {
  const originalKickoff = new Date('2026-10-15T20:00:00.000Z')
  const newEarlierKickoff = new Date('2026-10-15T18:00:00.000Z')
  const newDeadline = getPredictionDeadline(newEarlierKickoff) // 17:55:00

  assert.equal(newDeadline.toISOString(), '2026-10-15T17:55:00.000Z')

  // A submission made at 18:30 was before the old deadline (19:55),
  // but is AFTER the new earlier deadline (17:55) -> must be LOCKED
  const checkTime = new Date('2026-10-15T18:30:00.000Z')
  assert.equal(isPredictionLocked(newEarlierKickoff, checkTime, 'upcoming'), true)

  // A submission at 17:50 is before new earlier deadline -> ALLOWED
  const validTime = new Date('2026-10-15T17:50:00.000Z')
  assert.equal(isPredictionLocked(newEarlierKickoff, validTime, 'upcoming'), false)
})

test('Fixture rescheduled later: deadline shifts later, members can edit until new deadline', () => {
  const originalKickoff = new Date('2026-10-15T15:00:00.000Z') // Old deadline: 14:55
  const newLaterKickoff = new Date('2026-10-15T19:00:00.000Z') // New deadline: 18:55

  // Time is 16:00: original deadline passed, but new deadline is in the future
  const currentTime = new Date('2026-10-15T16:00:00.000Z')

  // Member can still submit / edit prediction
  assert.equal(isPredictionLocked(newLaterKickoff, currentTime, 'upcoming'), false)
  assert.doesNotThrow(() => assertCanPredict(newLaterKickoff, currentTime, 'upcoming'))

  // Once new later deadline passes (e.g. 18:56), it locks
  const afterNewDeadline = new Date('2026-10-15T18:56:00.000Z')
  assert.equal(isPredictionLocked(newLaterKickoff, afterNewDeadline, 'upcoming'), true)
})

test('Fixture states consistency: live, completed, postponed, and cancelled are locked', () => {
  const futureKickoff = new Date('2026-10-15T20:00:00.000Z')
  const currentTime = new Date('2026-10-15T18:00:00.000Z')

  // Non-upcoming statuses are locked even if kickoff is in the future
  assert.equal(isPredictionLocked(futureKickoff, currentTime, 'live'), true)
  assert.equal(isPredictionLocked(futureKickoff, currentTime, 'in_progress'), true)
  assert.equal(isPredictionLocked(futureKickoff, currentTime, 'completed'), true)
  assert.equal(isPredictionLocked(futureKickoff, currentTime, 'postponed'), true)
  assert.equal(isPredictionLocked(futureKickoff, currentTime, 'cancelled'), true)
})

test('Normalizing fixture status prevents contradictory combinations', () => {
  const kickoff = new Date('2026-10-15T19:30:00.000Z')
  
  // Future match
  assert.equal(
    normalizeFixtureStatus('upcoming', kickoff, false, new Date('2026-10-15T18:00:00.000Z')),
    'scheduled'
  )

  // Ongoing match (45 minutes into match)
  assert.equal(
    normalizeFixtureStatus('upcoming', kickoff, false, new Date('2026-10-15T20:15:00.000Z')),
    'in_progress'
  )

  // Past 105 mins without finalized
  assert.equal(
    normalizeFixtureStatus('upcoming', kickoff, false, new Date('2026-10-15T21:30:00.000Z')),
    'awaiting_result'
  )

  // Finalized
  assert.equal(
    normalizeFixtureStatus('completed', kickoff, true, new Date('2026-10-15T22:00:00.000Z')),
    'finalized'
  )

  // Postponed
  assert.equal(
    normalizeFixtureStatus('postponed', kickoff, false, new Date('2026-10-15T18:00:00.000Z')),
    'postponed'
  )

  // Cancelled
  assert.equal(
    normalizeFixtureStatus('cancelled', kickoff, false, new Date('2026-10-15T18:00:00.000Z')),
    'cancelled'
  )
})
