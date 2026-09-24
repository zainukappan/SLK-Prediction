import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { getTranslation, Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { MatchesList } from './MatchesList'

export default async function MatchesPage() {
  const profile = await getUserProfile()
  const locale = (profile?.language as Locale) || 'en'
  const t = (key: any) => getTranslation(locale, key)

  const supabase = await createClient()

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select(`
      *,
      home_team:teams!home_team_id(*),
      away_team:teams!away_team_id(*),
      predictions(home_score, away_score)
    `)
    .order('kickoff_time', { ascending: true })

  // The predictions join above returns an array. We can filter it in JS to match current user.
  // A better way is eq('predictions.user_id', profile.id) but Supabase JS doesn't easily support filtering inside joined tables without writing a custom query.

  const { data: userPredictions } = await supabase.from('predictions').select('*').eq('user_id', profile!.id)
  
  const predictionMap = new Map()
  userPredictions?.forEach(p => predictionMap.set(p.fixture_id, p))

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 -mt-4 z-10 space-y-4">
        <MatchesList fixtures={fixtures || []} predictionMap={Object.fromEntries(predictionMap)} locale={locale} />
      </div>
    </div>
  )
}
