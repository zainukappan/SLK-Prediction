import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { getTranslation, Locale, getTeamName, getTeamShortName } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PredictionForm } from './PredictionForm'
import { Clock, AlertCircle, ArrowLeft } from 'lucide-react'
import { Countdown } from '@/components/Countdown'
import { getPredictionDeadline, isPredictionLocked } from '@/lib/deadline'
import { formatInTimeZone } from 'date-fns-tz'
import Link from 'next/link'

export default async function MatchPredictionPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getUserProfile()
  const locale = (profile?.language as Locale) || 'en'
  const t = (key: any) => getTranslation(locale, key)

  const supabase = await createClient()

  // In Next.js 15+, params is a Promise
  const { id } = await params

  const { data: match } = await supabase
    .from('fixtures')
    .select(`
      *,
      home_team:teams!home_team_id(*),
      away_team:teams!away_team_id(*)
    `)
    .eq('id', id)
    .single()

  if (!match) {
    redirect('/matches')
  }

  const { data: prediction } = await supabase
    .from('predictions')
    .select('*')
    .eq('fixture_id', id)
    .eq('user_id', profile!.id)
    .single()

  const serverTime = new Date()
  const deadlineTime = getPredictionDeadline(match.kickoff_time)
  const isLocked = isPredictionLocked(match.kickoff_time, serverTime, match.status)

  const homeName = getTeamName(match.home_team, locale)
  const awayName = getTeamName(match.away_team, locale)
  const homeShort = getTeamShortName(match.home_team, locale)
  const awayShort = getTeamShortName(match.away_team, locale)

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 -mt-4 z-10 space-y-4">
        <Link href="/matches" className="inline-flex items-center gap-2 text-sbk-blue font-bold text-xs px-2 hover:underline">
          <ArrowLeft className="w-4 h-4" /> {locale === 'ml' ? 'എല്ലാ മത്സരങ്ങളും' : 'Back to Matches'}
        </Link>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          
          {/* Rescheduled Notice */}
          {match.is_rescheduled && (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span>{t('rescheduled')}: {match.rescheduled_reason || t('rescheduledNotice')}</span>
                <p className="text-[10px] text-amber-800 font-normal mt-0.5">
                  Predictions deadline has been updated to match the new kickoff.
                </p>
              </div>
            </div>
          )}

          {/* Countdown / Deadline Status */}
          <div className="flex justify-center mb-6">
            {!isLocked ? (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-xs font-bold border border-red-100 shadow-sm">
                <Clock className="w-4 h-4" />
                <span>{t('predictionClosesIn')} <Countdown deadline={deadlineTime.toISOString()} /></span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-xs font-bold border border-gray-200">
                <Clock className="w-4 h-4" />
                <span>Predictions Closed</span>
              </div>
            )}
          </div>

          {/* Team Cards */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col items-center flex-1">
              <div className="w-20 h-20 bg-blue-100 text-blue-900 rounded-full mb-2 flex items-center justify-center text-xl font-black border-4 border-blue-50 shadow-sm overflow-hidden">
                {homeShort}
              </div>
              <span className="text-xs font-bold text-center text-gray-900 line-clamp-2 px-1">{homeName}</span>
            </div>
            
            <div className="px-3 font-black text-gray-300 text-xl text-center">VS</div>

            <div className="flex flex-col items-center flex-1">
              <div className="w-20 h-20 bg-red-100 text-red-900 rounded-full mb-2 flex items-center justify-center text-xl font-black border-4 border-red-50 shadow-sm overflow-hidden">
                {awayShort}
              </div>
              <span className="text-xs font-bold text-center text-gray-900 line-clamp-2 px-1">{awayName}</span>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 mb-6 font-semibold bg-gray-50 py-2 rounded-xl border border-gray-100">
            Kickoff: {formatInTimeZone(new Date(match.kickoff_time), 'Asia/Kolkata', "EEE, MMM d, yyyy 'at' h:mm a")} {t('ist')}
          </div>

          {/* Prediction Input Form */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-center font-bold text-gray-500 text-xs tracking-widest uppercase mb-4">
              {t('yourPrediction')}
            </h3>
            <PredictionForm 
              matchId={match.id} 
              initialHome={prediction?.home_score ?? 0}
              initialAway={prediction?.away_score ?? 0}
              isLocked={isLocked}
              locale={locale}
              hasExisting={!!prediction}
              homeTeamName={homeShort}
              awayTeamName={awayShort}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
