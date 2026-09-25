import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { getTranslation, Locale } from '@/lib/i18n'
import { ShareCard } from './ShareCard'
import { createClient } from '@/lib/supabase/server'
import { LanguageToggle } from './LanguageToggle'
import Link from 'next/link'
import { calculateLeaderboard, RawFixture, RawPrediction, RawProfile } from '@/lib/scoring'
import { ShieldCheck, ChevronRight, LogOut, Settings } from 'lucide-react'

export default async function ProfilePage() {
  const profile = await getUserProfile()
  const locale = (profile?.language as Locale) || 'en'
  const t = (key: any) => getTranslation(locale, key)
  const supabase = await createClient()

  const { data: usersData } = await supabase.from('profiles').select('id, display_name, status')
  const { data: predictions } = await supabase.from('predictions').select('*')
  const { data: fixtures } = await supabase.from('fixtures').select('*')

  const { leaderboard } = calculateLeaderboard(
    (usersData as RawProfile[]) || [],
    (predictions as RawPrediction[]) || [],
    (fixtures as RawFixture[]) || []
  )

  const myEntry = leaderboard.find((u) => u.id === profile?.id)

  const myPoints = myEntry?.points ?? 0
  const myRank = myEntry?.rank ?? leaderboard.length
  const myExact = myEntry?.exact ?? 0
  const myOutcome = myEntry?.outcome ?? 0
  const sharedRankDisplay = myEntry?.sharedRankDisplay || `#${myRank}`

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 -mt-4 z-10 space-y-4">
        
        {/* Share Rank Card Section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center">
          <ShareCard 
            name={profile?.display_name || 'Member'} 
            rank={myRank} 
            points={myPoints}
            exact={myExact}
            outcome={myOutcome}
            sharedRankDisplay={sharedRankDisplay}
            locale={locale}
          />
        </div>

        {/* Language Selection */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4 text-sbk-blue" />
            {t('language')}
          </h3>
          <LanguageToggle currentLocale={locale} />
        </div>

        {/* Rules Navigation */}
        <Link 
          href="/rules" 
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sbk-blue" />
            <span className="font-bold text-gray-800 text-sm">{t('rules')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        {/* Admin Dashboard Entry (Admin only) */}
        {profile?.role === 'admin' && (
          <Link 
            href="/admin" 
            className="block bg-sbk-navy hover:bg-slate-800 text-white rounded-2xl p-4 shadow-md font-bold text-center text-sm transition-colors"
          >
            {t('adminDashboard')}
          </Link>
        )}

        {/* Sign Out */}
        <form action="/auth/logout" method="post" className="w-full pt-2">
          <button 
            type="submit" 
            className="w-full py-3.5 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors text-xs flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('signOut')}</span>
          </button>
        </form>

      </div>
    </div>
  )
}
