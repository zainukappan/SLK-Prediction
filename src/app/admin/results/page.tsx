import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy } from 'lucide-react'
import { ResultsManager } from './ResultsManager'
import { Locale } from '@/lib/i18n'

export default async function AdminResultsPage() {
  const profile = await getUserProfile()
  if (profile?.role !== 'admin') redirect('/home')

  const locale = (profile?.language as Locale) || 'en'
  const supabase = await createClient()

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)')
    .order('kickoff_time', { ascending: false })

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 -mt-4 z-10 space-y-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sbk-blue font-bold text-xs px-2 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Admin Overview
        </Link>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-sbk-navy flex items-center gap-2">
              <Trophy className="w-5 h-5 text-sbk-blue" />
              Finalize & Correct Match Results
            </h2>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Enter full-time match scores. Preview points and standings changes before finalizing. Correcting an already finalized result requires a reason and updates all member rankings and audit logs.
          </p>

          <ResultsManager
            fixtures={fixtures || []}
            locale={locale}
          />
        </div>
      </div>
    </div>
  )
}
