'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatInTimeZone } from 'date-fns-tz'
import { getTranslation, Locale } from '@/lib/i18n'

export function MatchesList({ fixtures, predictionMap, locale }: { fixtures: any[], predictionMap: Record<string, any>, locale: Locale }) {
  const [filter, setFilter] = useState<string>('all')
  const t = (key: any) => getTranslation(locale, key)

  const filteredFixtures = fixtures.filter(match => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return match.status === 'upcoming'
    if (filter === 'live') return match.status === 'live'
    if (filter === 'completed') return match.status === 'completed'
    return match.status === filter
  })

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
        {['all', 'upcoming', 'live', 'completed', 'postponed', 'cancelled'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
              filter === f ? 'bg-sbk-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredFixtures.map((match) => {
          const userPred = predictionMap[match.id]
          const deadlineTime = new Date(new Date(match.kickoff_time).getTime() - 5 * 60000)
          const isLocked = new Date() > deadlineTime || match.status !== 'upcoming'
          
          return (
            <Link href={`/matches/${match.id}`} key={match.id} className="block">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-transform active:scale-[0.98]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                    {formatInTimeZone(new Date(match.kickoff_time), 'Asia/Kolkata', "MMM d, h:mm a")} {t('ist')}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                    match.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                    match.status === 'live' ? 'bg-red-100 text-red-600 animate-pulse' :
                    isLocked ? 'bg-gray-100 text-gray-400' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {match.status === 'upcoming' ? (isLocked ? 'Locked' : 'Open') : match.status}
                  </span>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col items-center w-24">
                    <span className="font-bold text-sm text-center line-clamp-1 text-gray-900">{match.home_team.short_name}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    {match.status === 'completed' || match.status === 'live' ? (
                      <div className="bg-sbk-navy text-white px-3 py-1 rounded font-black text-lg">
                        {match.home_score ?? 0} - {match.away_score ?? 0}
                      </div>
                    ) : (
                      <span className="font-black text-gray-300 text-lg">VS</span>
                    )}
                  </div>
                  <div className="flex flex-col items-center w-24">
                    <span className="font-bold text-sm text-center line-clamp-1 text-gray-900">{match.away_team.short_name}</span>
                  </div>
                </div>
                
                {userPred && (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium text-xs">{t('yourPrediction')}</span>
                    <span className="font-bold text-sbk-blue bg-blue-50 px-2 py-0.5 rounded">
                      {userPred.home_score} - {userPred.away_score}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          )
        })}
        {filteredFixtures.length === 0 && (
          <div className="text-center text-gray-500 py-10 bg-white rounded-2xl shadow-sm">{t('noMatches')}</div>
        )}
      </div>
    </>
  )
}
