import { createClient } from './supabase/server'
import { cache } from 'react'
import { cookies } from 'next/headers'

export const getUserProfile = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // Check language cookie preference
  try {
    const cookieStore = await cookies()
    const cookieLang = cookieStore.get('sbk_lang')?.value
    if (cookieLang === 'en' || cookieLang === 'ml') {
      profile.language = cookieLang
    }
  } catch (e) {
    // ignore in environments where cookies() isn't accessible
  }

  // Protect private admin_notes: Never show these notes to members
  if (profile.role !== 'admin') {
    delete (profile as any).admin_notes
  }

  return profile
})
