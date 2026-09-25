'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateLanguage(locale: string) {
  const cookieStore = await cookies()
  cookieStore.set('sbk_lang', locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('profiles').update({ language: locale }).eq('id', user.id)
  }

  revalidatePath('/', 'layout')
}
