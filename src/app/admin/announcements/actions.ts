'use server'

import { createClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin-audit'
import { revalidatePath } from 'next/cache'

export async function saveRulesAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const title_en = (formData.get('title_en') as string || 'Contest Rules').trim()
  const title_ml = (formData.get('title_ml') as string || 'മത്സര നിയമങ്ങൾ').trim()
  const content_en = (formData.get('content_en') as string || '').trim()
  const content_ml = (formData.get('content_ml') as string || '').trim()

  if (!content_en || !content_ml) {
    return { error: 'Both English and Malayalam rules content are required' }
  }

  // Check if existing rule row exists
  const { data: existing } = await supabase.from('rules').select('*').limit(1)

  let error
  const now = new Date().toISOString()
  if (existing && existing.length > 0) {
    const res = await supabase.from('rules').update({
      title_en,
      title_ml,
      content_en,
      content_ml,
      updated_by: user.id,
      updated_at: now,
    }).eq('id', existing[0].id)
    error = res.error
  } else {
    const res = await supabase.from('rules').insert({
      title_en,
      title_ml,
      content_en,
      content_ml,
      updated_by: user.id,
      updated_at: now,
    })
    error = res.error
  }

  if (error) return { error: error.message }

  await logAdminAction({
    admin_id: user.id,
    action: 'rules_updated',
    target_type: 'rules',
    reason: 'Updated bilingual contest rules',
    new_state: { title_en, title_ml, content_en, content_ml, updated_at: now },
  })

  revalidatePath('/rules')
  revalidatePath('/admin/announcements')
  revalidatePath('/admin')
  return { success: true }
}

export async function saveAnnouncementAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const id = formData.get('id') as string | null
  const title_en = (formData.get('title_en') as string || '').trim()
  const title_ml = (formData.get('title_ml') as string || '').trim()
  const content_en = (formData.get('content_en') as string || '').trim()
  const content_ml = (formData.get('content_ml') as string || '').trim()
  const active = formData.get('active') === 'true' || formData.get('active') === 'on'

  if (!title_en || !content_en) {
    return { error: 'English title and content are required' }
  }

  const payload: any = {
    title_en,
    title_ml: title_ml || title_en,
    content_en,
    content_ml: content_ml || content_en,
    active,
    created_by: user.id,
  }

  let error
  if (id) {
    const res = await supabase.from('announcements').update(payload).eq('id', id)
    error = res.error
  } else {
    const res = await supabase.from('announcements').insert(payload)
    error = res.error
  }

  if (error) return { error: error.message }

  await logAdminAction({
    admin_id: user.id,
    action: id ? 'announcement_updated' : 'announcement_created',
    target_type: 'announcement',
    target_id: id || undefined,
    new_state: payload,
  })

  revalidatePath('/home')
  revalidatePath('/admin/announcements')
  return { success: true }
}

export async function deleteAnnouncementAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) return { error: error.message }

  await logAdminAction({
    admin_id: user.id,
    action: 'announcement_deleted',
    target_type: 'announcement',
    target_id: id,
  })

  revalidatePath('/home')
  revalidatePath('/admin/announcements')
  return { success: true }
}
