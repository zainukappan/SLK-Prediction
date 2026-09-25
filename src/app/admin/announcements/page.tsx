import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bell } from 'lucide-react'
import { AnnouncementsAndRulesManager } from './AnnouncementsAndRulesManager'
import { Locale } from '@/lib/i18n'

export default async function AdminAnnouncementsPage() {
  const profile = await getUserProfile()
  if (profile?.role !== 'admin') redirect('/home')

  const locale = (profile?.language as Locale) || 'en'
  const supabase = await createClient()

  const { data: rulesList } = await supabase.from('rules').select('*').limit(1)
  const currentRules = rulesList && rulesList.length > 0 ? rulesList[0] : null

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 -mt-4 z-10 space-y-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sbk-blue font-bold text-xs px-2 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Admin Overview
        </Link>

        <AnnouncementsAndRulesManager
          rules={currentRules}
          announcements={announcements || []}
        />
      </div>
    </div>
  )
}
