import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { getTranslation, Locale } from '@/lib/i18n'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { Countdown } from '@/components/Countdown'

export default async function HomePage() {
  const profile = await getUserProfile()
  const locale = (profile?.language as Locale) || 'en'
  const t = (key: any) => getTranslation(locale, key)

  const supabase = await createClient()

  // Get next upcoming match
  const { data: nextMatch } = await supabase
    .from('fixtures')
    .select(`
      *,
      home_team:teams!home_team_id(*),
      away_team:teams!away_team_id(*)
    `)
    .in('status', ['upcoming'])
    .order('kickoff_time', { ascending: true })
    .limit(1)
    .single()

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 space-y-6 -mt-4">
        {/* Next Match Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-800 text-sm uppercase">{t('nextMatch')}</h2>
            {nextMatch && (
              <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{t('locksIn')} <Countdown deadline={new Date(new Date(nextMatch.kickoff_time).getTime() - 5 * 60000).toISOString()} /></span>
              </div>
            )}
          </div>

          {nextMatch ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 bg-blue-100 rounded-full mb-2 flex items-center justify-center text-xl font-bold overflow-hidden">
                    {nextMatch.home_team.short_name}
                  </div>
                  <span className="text-xs font-semibold text-center">{nextMatch.home_team.name}</span>
                </div>
                <div className="px-4 font-bold text-gray-400 text-lg">VS</div>
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 bg-red-100 rounded-full mb-2 flex items-center justify-center text-xl font-bold overflow-hidden">
                    {nextMatch.away_team.short_name}
                  </div>
                  <span className="text-xs font-semibold text-center">{nextMatch.away_team.name}</span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 mb-4 font-medium">
                {formatInTimeZone(new Date(nextMatch.kickoff_time), 'Asia/Kolkata', "MMM d, h:mm a")} IST
              </div>

              <Link href={`/matches/${nextMatch.id}`} className="block">
                <button className="w-full bg-sbk-yellow text-sbk-navy font-bold py-3 rounded-xl hover:bg-yellow-500 transition shadow-sm text-lg flex items-center justify-center gap-2">
                  {t('predictNow')}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </Link>
            </>
          ) : (
            <div className="text-center text-gray-500 py-6">{t('noMatches')}</div>
          )}
        </div>

      </div>
    </div>
  )
}
