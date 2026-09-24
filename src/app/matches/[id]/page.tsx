import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { getTranslation, Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PredictionForm } from './PredictionForm'
import { Clock } from 'lucide-react'
import { Countdown } from '@/components/Countdown'

export default async function MatchPredictionPage({ params }: { params: { id: string } }) {
  const profile = await getUserProfile()
  const locale = (profile?.language as Locale) || 'en'
  const t = (key: any) => getTranslation(locale, key)

  const supabase = await createClient()

  // Wait for params in Next.js 15 (if applicable, but in 14 it's fine without await, wait params is a promise in 15)
  // To be safe with the type `params: { id: string }`
  const { id } = await params;

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

  const deadlineTime = new Date(new Date(match.kickoff_time).getTime() - 5 * 60000)
  const isLocked = new Date() > deadlineTime || match.status !== 'upcoming'

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 -mt-4 z-10">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-bold border border-red-100">
              <Clock className="w-4 h-4" />
              <span>{t('predictionClosesIn')} <Countdown deadline={deadlineTime.toISOString()} /></span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div className="flex flex-col items-center flex-1">
              <div className="w-20 h-20 bg-blue-100 text-blue-900 rounded-full mb-2 flex items-center justify-center text-2xl font-bold border-4 border-blue-50">
                {match.home_team.short_name}
              </div>
              <span className="text-sm font-bold text-center text-gray-900">{match.home_team.name}</span>
            </div>
            <div className="px-4 font-bold text-gray-400 text-xl text-center">VS</div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-20 h-20 bg-red-100 text-red-900 rounded-full mb-2 flex items-center justify-center text-2xl font-bold border-4 border-red-50">
                {match.away_team.short_name}
              </div>
              <span className="text-sm font-bold text-center text-gray-900">{match.away_team.name}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-center font-bold text-gray-500 text-xs tracking-widest uppercase mb-4">{t('yourPrediction')}</h3>
            <PredictionForm 
              matchId={match.id} 
              initialHome={prediction?.home_score ?? 0}
              initialAway={prediction?.away_score ?? 0}
              isLocked={isLocked}
              locale={locale}
              hasExisting={!!prediction}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
