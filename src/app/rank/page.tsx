import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { getTranslation, Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { Trophy, Clock, HelpCircle } from 'lucide-react'
import { calculateLeaderboard, RawFixture, RawPrediction, RawProfile } from '@/lib/scoring'
import { formatInTimeZone } from 'date-fns-tz'
import Link from 'next/link'

export default async function RankPage() {
  const profile = await getUserProfile()
  const locale = (profile?.language as Locale) || 'en'
  const t = (key: any) => getTranslation(locale, key)
  const supabase = await createClient()

  const { data: usersData } = await supabase.from('profiles').select('id, display_name, status')
  const { data: predictions } = await supabase.from('predictions').select('*')
  const { data: fixtures } = await supabase.from('fixtures').select('*')

  const { leaderboard, lastUpdatedAt } = calculateLeaderboard(
    (usersData as RawProfile[]) || [],
    (predictions as RawPrediction[]) || [],
    (fixtures as RawFixture[]) || []
  )

  const formattedLastUpdated = lastUpdatedAt
    ? formatInTimeZone(new Date(lastUpdatedAt), 'Asia/Kolkata', "MMM d, yyyy h:mm a") + ' IST'
    : 'No match results finalized yet'

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 -mt-4 z-10 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 min-h-[500px]">
          
          {/* Header & Last Updated */}
          <div className="flex flex-col items-center mb-5 pb-3 border-b border-gray-100">
            <h2 className="text-xl font-black text-sbk-navy flex items-center gap-2">
              <Trophy className="w-5 h-5 text-sbk-yellow" />
              {t('leaderboard')}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{t('leaderboardUpdated')}: <strong className="text-gray-700">{formattedLastUpdated}</strong></span>
            </div>
          </div>

          {/* Column Headers */}
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase border-b border-gray-100 pb-2 mb-2 px-2">
            <div className="flex items-center gap-3">
              <span className="w-8 text-center">#</span>
              <span>Member</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-center w-12 hidden sm:inline" title="Exact Scores (5 pts)">Exact</span>
              <span className="text-center w-12 hidden sm:inline" title="Correct Outcomes (Exact + Outcome)">Outcome</span>
              <span className="w-12 text-right">{t('points')}</span>
            </div>
          </div>

          {/* Leaderboard Entries */}
          <div className="space-y-1.5">
            {leaderboard.map((user) => {
              const isMe = user.id === profile?.id
              return (
                <div 
                  key={user.id} 
                  className={`flex justify-between items-center p-2.5 rounded-xl transition-all ${
                    isMe 
                      ? 'bg-yellow-50 border-2 border-sbk-yellow/60 shadow-sm' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black shrink-0 ${
                      user.rank === 1 ? 'bg-amber-400 text-amber-950 shadow-sm' :
                      user.rank === 2 ? 'bg-slate-300 text-slate-800' :
                      user.rank === 3 ? 'bg-amber-600 text-white' :
                      isMe ? 'bg-yellow-200 text-yellow-950' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.sharedRankDisplay}
                    </span>

                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-sbk-navy flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className={`font-bold text-xs line-clamp-1 ${isMe ? 'text-sbk-navy font-black' : 'text-gray-800'}`}>
                          {user.name} {isMe && `(${locale === 'ml' ? 'നിങ്ങൾ' : 'You'})`}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 sm:hidden">
                          <span>{user.exact} Exact</span>
                          <span>•</span>
                          <span>{user.outcome} Outcomes</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-semibold w-12 text-center hidden sm:inline">
                      {user.exact}
                    </span>
                    <span className="text-xs text-gray-500 font-semibold w-12 text-center hidden sm:inline">
                      {user.outcome}
                    </span>
                    <span className={`text-base font-black w-12 text-right ${isMe ? 'text-sbk-navy' : 'text-gray-900'}`}>
                      {user.points}
                    </span>
                  </div>
                </div>
              )
            })}

            {leaderboard.length === 0 && (
              <div className="text-center text-gray-500 py-16 text-xs">
                No active leaderboard participants found.
              </div>
            )}
          </div>

          {/* Tie-Breaker Explanation Footnote */}
          <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <span>Ties resolved by: Points &rarr; Exact Scores &rarr; Correct Outcomes</span>
            <Link href="/rules" className="text-sbk-blue font-bold hover:underline flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              {t('rules')}
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
