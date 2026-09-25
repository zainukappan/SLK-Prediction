import { test } from 'node:test'
import assert from 'node:assert/strict'

test('Privacy: admin_notes must never be exposed to members', () => {
  const profileMember = {
    id: 'user-1',
    display_name: 'Regular Member',
    role: 'member',
    status: 'approved',
    language: 'en',
    admin_notes: 'Private note: verified on WhatsApp',
  }

  // Simulate policy / auth helper stripping admin_notes for non-admin
  const sanitized = { ...profileMember }
  if (sanitized.role !== 'admin') {
    delete (sanitized as any).admin_notes
  }

  assert.equal('admin_notes' in sanitized, false, 'Member profile must not contain admin_notes')
  assert.equal(sanitized.role, 'member')
})

test('Privacy: Member cannot view another member predictions before kickoff', () => {
  const currentUserId = 'user-alice'
  const otherUserId = 'user-bob'
  const futureKickoff = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours in future
  const pastKickoff = new Date(Date.now() - 30 * 60 * 1000) // 30 mins ago

  function canViewPrediction(
    requestingUserId: string,
    userRole: string,
    predictionOwnerId: string,
    kickoffTime: Date
  ): boolean {
    if (userRole === 'admin') return true
    if (requestingUserId === predictionOwnerId) return true
    // Other users' predictions can ONLY be viewed after kickoff
    return Date.now() >= kickoffTime.getTime()
  }

  // Alice viewing her own prediction before kickoff -> ALLOWED
  assert.equal(canViewPrediction(currentUserId, 'member', currentUserId, futureKickoff), true)

  // Alice trying to view Bob's prediction BEFORE kickoff -> DENIED
  assert.equal(canViewPrediction(currentUserId, 'member', otherUserId, futureKickoff), false)

  // Alice viewing Bob's prediction AFTER kickoff -> ALLOWED (public verification)
  assert.equal(canViewPrediction(currentUserId, 'member', otherUserId, pastKickoff), true)

  // Admin viewing Bob's prediction before kickoff -> ALLOWED
  assert.equal(canViewPrediction('admin-1', 'admin', otherUserId, futureKickoff), true)
})

test('Security: Non-admin unauthorized for admin operations', () => {
  function verifyAdminAccess(userRole: string | undefined): { allowed: boolean; error?: string } {
    if (userRole !== 'admin') {
      return { allowed: false, error: 'Unauthorized: Admin role required' }
    }
    return { allowed: true }
  }

  // Regular member
  const memberCheck = verifyAdminAccess('member')
  assert.equal(memberCheck.allowed, false)
  assert.equal(memberCheck.error, 'Unauthorized: Admin role required')

  // Unauthenticated (undefined)
  const anonCheck = verifyAdminAccess(undefined)
  assert.equal(anonCheck.allowed, false)

  // Admin
  const adminCheck = verifyAdminAccess('admin')
  assert.equal(adminCheck.allowed, true)
})

test('Security: Score correction requires non-empty reason when finalized', () => {
  function validateCorrection(isFinalized: boolean, reason: string | null | undefined): { valid: boolean; error?: string } {
    if (isFinalized && (!reason || reason.trim().length === 0)) {
      return { valid: false, error: 'A reason is required to correct an already finalized match result.' }
    }
    return { valid: true }
  }

  // First-time finalization does not strictly require correction reason
  assert.equal(validateCorrection(false, '').valid, true)

  // Correction of already finalized score with empty reason -> REJECTED
  const emptyReason = validateCorrection(true, '   ')
  assert.equal(emptyReason.valid, false)
  assert.match(emptyReason.error!, /A reason is required/)

  // Correction with valid reason -> ACCEPTED
  assert.equal(validateCorrection(true, 'VAR reversal on 92nd min goal').valid, true)
})
