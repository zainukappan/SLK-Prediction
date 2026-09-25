import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { getTranslation, Locale, getTeamName, getTeamShortName } from '@/lib/i18n'
import Link from 'next/link'
import { Clock, AlertCircle, ArrowRight, Bell, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatInTimeZone } from 'date-fns-tz'
import { Countdown } from '@/components/Countdown'
import { getPredictionDeadline } from '@/lib/deadline'

export default async function HomePage() {
  const profile = await getUserProfile()
  const locale = (profile?.language as Locale) || 'en'
  const t = (key: any) => getTranslation(locale, key)

  const supabase = await createClient()

  // 1. Get next upcoming match
  const { data: nextMatch } = await supabase
    .from('fixtures')
    .select(`
      *,
      home_team:teams!home_team_id(*),
      away_team:teams!away_team_id(*)
    `)
    .in('status', ['upcoming'])
    .gt('kickoff_time', new Date().toISOString())
    .order('kickoff_time', { ascending: true })
    .limit(1)
    .single()

  // 2. Get active announcements
  const { data: activeAnnouncements } = await supabase
    .from('announcements')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(2)

  const deadline = nextMatch ? getPredictionDeadline(nextMatch.kickoff_time) : null

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 space-y-4 -mt-4 z-10">
        
        {/* Active Bilingual Announcements */}
        {activeAnnouncements && activeAnnouncements.length > 0 && (
          <div className="space-y-2">
            {activeAnnouncements.map((ann) => {
              const title = locale === 'ml' && ann.title_ml ? ann.title_ml : ann.title_en
              const content = locale === 'ml' && ann.content_ml ? ann.content_ml : ann.content_en
              return (
                <div
                  key={ann.id}
                  className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm text-xs text-amber-900 space-y-1"
                >
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <Bell className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{title}</span>
                  </div>
                  <p className="text-amber-900/90 whitespace-pre-line text-xs pl-6">
                    {content}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Next Match Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-800 text-xs tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sbk-blue animate-ping" />
              {t('nextMatch')}
            </h2>
            {nextMatch && deadline && (
              <div className="bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Clock className="w-3 h-3" />
                <span>{t('locksIn')} <Countdown deadline={deadline.toISOString()} /></span>
              </div>
            )}
          </div>

          {nextMatch ? (
            <>
              {nextMatch.is_rescheduled && (
                <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('rescheduled')}: {nextMatch.rescheduled_reason || t('rescheduledNotice')}</span>
                </div>
              )}

              <div className="flex justify-between items-center mb-6 py-2">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 bg-blue-100 text-blue-900 rounded-full mb-2 flex items-center justify-center text-base font-black border-2 border-blue-200 shadow-sm overflow-hidden">
                    {getTeamShortName(nextMatch.home_team, locale)}
                  </div>
                  <span className="text-xs font-bold text-center text-gray-900 line-clamp-2 px-1">
                    {getTeamName(nextMatch.home_team, locale)}
                  </span>
                </div>

                <div className="px-4 font-black text-gray-300 text-xl tracking-wider">VS</div>

                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 bg-red-100 text-red-900 rounded-full mb-2 flex items-center justify-center text-base font-black border-2 border-red-200 shadow-sm overflow-hidden">
                    {getTeamShortName(nextMatch.away_team, locale)}
                  </div>
                  <span className="text-xs font-bold text-center text-gray-900 line-clamp-2 px-1">
                    {getTeamName(nextMatch.away_team, locale)}
                  </span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 mb-5 font-semibold bg-gray-50 py-2 rounded-xl border border-gray-100">
                Kickoff: {formatInTimeZone(new Date(nextMatch.kickoff_time), 'Asia/Kolkata', "EEEE, MMM d, yyyy 'at' h:mm a")} {t('ist')}
              </div>

              <Link href={`/matches/${nextMatch.id}`} className="block">
                <button className="w-full bg-sbk-yellow hover:bg-yellow-500 text-sbk-navy font-black py-3.5 rounded-xl transition-all shadow-md text-base flex items-center justify-center gap-2 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-sbk-navy">
                  <span>{t('predictNow')}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </Link>
            </>
          ) : (
            <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-xl text-xs">
              {t('noMatches')}
            </div>
          )}
        </div>

        {/* Quick Links / Shortcuts */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/matches" className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:bg-gray-50">
            <div>
              <p className="font-bold text-xs text-gray-900">{t('matches')}</p>
              <p className="text-[10px] text-gray-400">View all fixtures</p>
            </div>
            <ArrowRight className="w-4 h-4 text-sbk-blue" />
          </Link>
          <Link href="/rank" className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:bg-gray-50">
            <div>
              <p className="font-bold text-xs text-gray-900">{t('leaderboard')}</p>
              <p className="text-[10px] text-gray-400">Current standings</p>
            </div>
            <ArrowRight className="w-4 h-4 text-sbk-blue" />
          </Link>
        </div>

      </div>
    </div>
  )
}
