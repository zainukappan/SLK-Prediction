import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function AdminResultsPage() {
  const profile = await getUserProfile()
  if (profile?.role !== 'admin') redirect('/home')

  const supabase = await createClient()
  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)')
    .order('kickoff_time', { ascending: false })

  async function updateResult(formData: FormData) {
    'use server'
    const fixtureId = formData.get('fixtureId') as string
    const homeScore = parseInt(formData.get('homeScore') as string)
    const awayScore = parseInt(formData.get('awayScore') as string)
    const status = formData.get('status') as string
    const isFinalized = status === 'completed'

    const adminSupabase = await createClient()
    
    // Update fixture
    await adminSupabase.from('fixtures').update({ 
      home_score: homeScore, 
      away_score: awayScore, 
      status,
      finalized: isFinalized
    }).eq('id', fixtureId)

    // Calculate points if finalized
    if (isFinalized) {
      const { data: predictions } = await adminSupabase.from('predictions').select('*').eq('fixture_id', fixtureId)
      
      const realHomeOutcome = homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw'

      if (predictions) {
        for (const pred of predictions) {
          let points = 0
          
          if (pred.home_score === homeScore && pred.away_score === awayScore) {
            points = 5 // Exact match
          } else {
            const predOutcome = pred.home_score > pred.away_score ? 'home' : pred.home_score < pred.away_score ? 'away' : 'draw'
            if (predOutcome === realHomeOutcome) {
              points = 3 // Correct outcome
            }
          }

          await adminSupabase.from('predictions').update({ 
            points_awarded: points,
            points_reason: points === 5 ? 'Exact Score' : points === 3 ? 'Correct Outcome' : 'Incorrect'
          }).eq('id', pred.id)
        }
      }
    }

    revalidatePath('/admin/results')
    revalidatePath('/rank')
    revalidatePath('/matches')
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale="en" />
      <div className="p-4 -mt-4 z-10 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-sbk-navy mb-6">Finalize Results</h2>
          
          <div className="space-y-6">
            {fixtures?.map(match => (
              <form key={match.id} action={updateResult} className="flex flex-col gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50">
                <input type="hidden" name="fixtureId" value={match.id} />
                
                <div className="flex justify-between items-center text-sm font-bold text-gray-700">
                  <span>{match.home_team.name}</span>
                  <span>VS</span>
                  <span>{match.away_team.name}</span>
                </div>
                
                <div className="flex justify-between gap-4">
                  <input type="number" name="homeScore" defaultValue={match.home_score ?? ''} required className="w-16 p-2 text-center rounded border" placeholder="H" />
                  <select name="status" defaultValue={match.status} className="flex-1 p-2 rounded border text-sm">
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed (Finalize)</option>
                    <option value="postponed">Postponed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <input type="number" name="awayScore" defaultValue={match.away_score ?? ''} required className="w-16 p-2 text-center rounded border" placeholder="A" />
                </div>
                
                <button type="submit" className="w-full bg-sbk-blue text-white font-bold py-2 rounded-lg shadow-sm">
                  Save Result
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
