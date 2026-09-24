import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { getTranslation, Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { Trophy } from 'lucide-react'
import Link from 'next/link'

export default async function RankPage() {
  const profile = await getUserProfile()
  const locale = (profile?.language as Locale) || 'en'
  const t = (key: any) => getTranslation(locale, key)
  const supabase = await createClient()

  // To build the leaderboard, we need to sum points per user.
  // We can do this with a query or view. Since we don't have a view, we'll fetch all predictions with points and group them.
  // In a real large-scale app, we'd use a materialized view or trigger to update a total_points column in profiles.
  // For this size, querying is fine.
  
  const { data: usersData } = await supabase.from('profiles').select('id, display_name, status').eq('status', 'approved')
  const { data: predictions } = await supabase.from('predictions').select('user_id, points_awarded, home_score, away_score, fixture_id(home_score, away_score)')

  const leaderboardMap = new Map<string, { id: string, name: string, points: number, exact: number, outcome: number }>()

  usersData?.forEach(u => {
    leaderboardMap.set(u.id, { id: u.id, name: u.display_name, points: 0, exact: 0, outcome: 0 })
  })

  predictions?.forEach(p => {
    if (p.points_awarded !== null && leaderboardMap.has(p.user_id)) {
      const userStat = leaderboardMap.get(p.user_id)!
      userStat.points += p.points_awarded
      if (p.points_awarded === 5) userStat.exact += 1
      if (p.points_awarded === 3) userStat.outcome += 1
    }
  })

  const leaderboard = Array.from(leaderboardMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.exact !== a.exact) return b.exact - a.exact
    return b.outcome - a.outcome
  })

  // Calculate ranks (handling ties)
  let currentRank = 1
  let previousItem = leaderboard[0]
  const rankedLeaderboard = leaderboard.map((item, index) => {
    if (index > 0) {
      if (item.points === previousItem.points && item.exact === previousItem.exact && item.outcome === previousItem.outcome) {
        // Tie, same rank
      } else {
        currentRank = index + 1
      }
    }
    previousItem = item
    return { ...item, rank: currentRank }
  })

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 -mt-4 z-10">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 min-h-[500px]">
          <h2 className="text-xl font-bold text-sbk-navy mb-6 text-center">{t('leaderboard')}</h2>

          <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase border-b border-gray-100 pb-2 mb-2 px-2">
            <div className="flex gap-4">
              <span className="w-6 text-center">#</span>
              <span>User</span>
            </div>
            <span>{t('points')}</span>
          </div>

          <div className="space-y-1">
            {rankedLeaderboard.map((user) => {
              const isMe = user.id === profile?.id
              return (
                <div 
                  key={user.id} 
                  className={`flex justify-between items-center p-2 rounded-xl transition-colors ${
                    isMe ? 'bg-yellow-100 border border-yellow-200 shadow-sm' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      user.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                      user.rank === 2 ? 'bg-gray-300 text-gray-800' :
                      user.rank === 3 ? 'bg-amber-600 text-white' :
                      isMe ? 'bg-yellow-200 text-yellow-900' : 'text-gray-500'
                    }`}>
                      {user.rank}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sbk-navy flex items-center justify-center text-white font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`font-semibold ${isMe ? 'text-sbk-navy' : 'text-gray-800'}`}>
                        {user.name} {isMe && '(You)'}
                      </span>
                    </div>
                  </div>
                  <span className={`font-black ${isMe ? 'text-sbk-navy' : 'text-gray-800'}`}>{user.points}</span>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}
