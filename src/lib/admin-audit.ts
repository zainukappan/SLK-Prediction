import { createClient } from './supabase/server'

export interface AdminAuditEntry {
  id?: string
  admin_id?: string | null
  action: string
  target_type: 'fixture' | 'profile' | 'rules' | 'announcement' | 'team' | 'round'
  target_id?: string | null
  reason?: string | null
  previous_state?: any
  new_state?: any
  created_at?: string
}

/**
 * Records an entry in the private admin-only audit log.
 */
export async function logAdminAction(entry: AdminAuditEntry) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('admin_audit_logs').insert({
      admin_id: entry.admin_id || user?.id || null,
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id || null,
      reason: entry.reason || null,
      previous_state: entry.previous_state || null,
      new_state: entry.new_state || null,
    })
  } catch (err) {
    console.error('Failed to log admin action', err)
  }
}

/**
 * Fetches recent admin audit logs (authorized admin only).
 */
export async function getRecentAdminAuditLogs(limit: number = 20) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*, admin:profiles!admin_id(display_name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('Could not fetch admin audit logs:', error.message)
      return []
    }
    return data || []
  } catch (err) {
    console.error('Error fetching admin audit logs:', err)
    return []
  }
}
