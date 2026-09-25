'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatInTimeZone } from 'date-fns-tz'
import { getTranslation, Locale, getTeamShortName } from '@/lib/i18n'
import { isPredictionLocked } from '@/lib/deadline'
import { AlertCircle } from 'lucide-react'

export function MatchesList({
  fixtures,
  predictionMap,
  locale,
}: {
  fixtures: any[]
  predictionMap: Record<string, any>
  locale: Locale
}) {
  const [filter, setFilter] = useState<string>('all')
  const t = (key: any) => getTranslation(locale, key)

  const filteredFixtures = fixtures.filter((match) => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return match.status === 'upcoming'
    if (filter === 'live') return match.status === 'live' || match.status === 'in_progress'
    if (filter === 'completed') return match.status === 'completed' || match.finalized
    if (filter === 'postponed') return match.status === 'postponed'
    if (filter === 'cancelled') return match.status === 'cancelled'
    return match.status === filter
  })

  const getStatusLabel = (match: any, isLocked: boolean) => {
    if (match.status === 'completed' || match.finalized) return t('statusCompleted')
    if (match.status === 'live' || match.status === 'in_progress') return t('statusLive')
    if (match.status === 'postponed') return t('statusPostponed')
    if (match.status === 'cancelled') return t('statusCancelled')
    if (match.status === 'upcoming' || match.status === 'scheduled') {
      return isLocked ? t('locked') : t('statusUpcoming')
    }
    return match.status
  }

  return (
    <>
      {/* Category Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide px-1">
        {[
          { key: 'all', label: locale === 'ml' ? 'എല്ലാം' : 'All' },
          { key: 'upcoming', label: locale === 'ml' ? 'വരാനിരിക്കുന്നത്' : 'Upcoming' },
          { key: 'live', label: locale === 'ml' ? 'തത്സമയം' : 'Live' },
          { key: 'completed', label: locale === 'ml' ? 'അവസാനിച്ചു' : 'Completed' },
          { key: 'postponed', label: locale === 'ml' ? 'മാറ്റിവച്ചു' : 'Postponed' },
          { key: 'cancelled', label: locale === 'ml' ? 'റദ്ദാക്കി' : 'Cancelled' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === f.key
                ? 'bg-sbk-navy text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Match Cards List */}
      <div className="space-y-3">
        {filteredFixtures.map((match) => {
          const userPred = predictionMap[match.id]
          const isLocked = isPredictionLocked(match.kickoff_time, new Date(), match.status)
          const statusLabel = getStatusLabel(match, isLocked)

          const homeShort = getTeamShortName(match.home_team, locale)
          const awayShort = getTeamShortName(match.away_team, locale)

          return (
            <Link href={`/matches/${match.id}`} key={match.id} className="block group">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all hover:border-sbk-blue/30 active:scale-[0.99]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                    {formatInTimeZone(new Date(match.kickoff_time), 'Asia/Kolkata', 'MMM d, h:mm a')} {t('ist')}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    {match.is_rescheduled && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5">
                        <AlertCircle className="w-2.5 h-2.5" />
                        {t('rescheduled')}
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        match.status === 'completed' || match.finalized
                          ? 'bg-gray-100 text-gray-700'
                          : match.status === 'live' || match.status === 'in_progress'
                          ? 'bg-red-100 text-red-600 animate-pulse'
                          : match.status === 'postponed'
                          ? 'bg-amber-100 text-amber-800'
                          : match.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : isLocked
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <div className="flex flex-col items-center w-28">
                    <span className="font-bold text-sm text-center line-clamp-1 text-gray-900">
                      {homeShort}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    {match.status === 'completed' || match.finalized || match.status === 'live' ? (
                      <div className="bg-sbk-navy text-white px-3 py-1 rounded-lg font-black text-lg shadow-sm">
                        {match.home_score ?? 0} - {match.away_score ?? 0}
                      </div>
                    ) : (
                      <span className="font-black text-gray-300 text-lg">VS</span>
                    )}
                  </div>

                  <div className="flex flex-col items-center w-28">
                    <span className="font-bold text-sm text-center line-clamp-1 text-gray-900">
                      {awayShort}
                    </span>
                  </div>
                </div>

                {userPred && (
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">{t('yourPrediction')}</span>
                    <span className="font-bold text-sbk-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {userPred.home_score} - {userPred.away_score}
                      {userPred.points_awarded !== null && userPred.points_awarded !== undefined && (
                        <span className="ml-1.5 text-emerald-700 font-black">
                          (+{userPred.points_awarded} pts)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          )
        })}

        {filteredFixtures.length === 0 && (
          <div className="text-center text-gray-500 py-12 bg-white rounded-2xl shadow-sm text-xs">
            {t('noMatches')}
          </div>
        )}
      </div>
    </>
  )
}
