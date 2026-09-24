'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateLanguage(locale: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  await supabase.from('profiles').update({ language: locale }).eq('id', user.id)
}
