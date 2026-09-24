import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { getTranslation, Locale } from '@/lib/i18n'
import { ShareCard } from './ShareCard'
import { createClient } from '@/lib/supabase/server'
import { LanguageToggle } from './LanguageToggle'
import Link from 'next/link'

export default async function ProfilePage() {
  const profile = await getUserProfile()
  const locale = (profile?.language as Locale) || 'en'
  const t = (key: any) => getTranslation(locale, key)
  const supabase = await createClient()

  const { data: usersData } = await supabase.from('profiles').select('id')
  const { data: predictions } = await supabase.from('predictions').select('user_id, points_awarded')

  const leaderboardMap = new Map<string, number>()
  usersData?.forEach(u => leaderboardMap.set(u.id, 0))
  
  predictions?.forEach(p => {
    if (p.points_awarded !== null && leaderboardMap.has(p.user_id)) {
      leaderboardMap.set(p.user_id, leaderboardMap.get(p.user_id)! + p.points_awarded)
    }
  })

  const leaderboard = Array.from(leaderboardMap.entries()).map(([id, points]) => ({ id, points }))
  leaderboard.sort((a, b) => b.points - a.points)

  let myPoints = 0
  let myRank = 0

  leaderboard.forEach((u, index) => {
    if (u.id === profile?.id) {
      myPoints = u.points
      myRank = index + 1
    }
  })

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 -mt-4 z-10 space-y-4">
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center">
          <ShareCard 
            name={profile?.display_name || 'User'} 
            rank={myRank} 
            points={myPoints}
            locale={locale}
          />
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">{t('language')}</h3>
          <LanguageToggle currentLocale={locale} />
        </div>

        <Link href="/rules" className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <span className="font-bold text-gray-800">{t('rules')}</span>
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>

        {profile?.role === 'admin' && (
          <Link href="/admin" className="block bg-sbk-navy text-white rounded-2xl p-4 shadow-sm font-bold text-center">
            {t('adminDashboard')}
          </Link>
        )}

        <form action="/auth/logout" method="post" className="w-full pt-4">
          <button type="submit" className="w-full py-4 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
            {t('signOut')}
          </button>
        </form>

      </div>
    </div>
  )
}
