'use server'

import { createClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin-audit'
import { revalidatePath } from 'next/cache'

export async function updateUserStatus(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    return { error: 'Unauthorized: Admin role required' }
  }

  const userId = formData.get('userId') as string
  const newStatus = formData.get('status') as string
  const adminNote = (formData.get('adminNote') as string || '').trim()

  if (!userId || !newStatus) {
    return { error: 'User ID and status are required' }
  }

  // Get previous profile
  const { data: prevProfile } = await supabase
    .from('profiles')
    .select('status, admin_notes')
    .eq('id', userId)
    .single()

  const updatePayload: Record<string, any> = { status: newStatus }
  if (adminNote) {
    updatePayload.admin_notes = adminNote
  }

  const { error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)

  if (error) {
    console.error('Failed to update user status', error)
    return { error: error.message }
  }

  // Log to private admin audit history
  await logAdminAction({
    admin_id: user.id,
    action: `user_status_${newStatus}`,
    target_type: 'profile',
    target_id: userId,
    reason: adminNote || `Status changed to ${newStatus}`,
    previous_state: prevProfile,
    new_state: { status: newStatus, admin_notes: adminNote || prevProfile?.admin_notes },
  })

  revalidatePath('/admin/users')
  revalidatePath('/admin')
  return { success: true }
}
