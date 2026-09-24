import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { getTranslation, Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createFixture, deleteFixture } from './actions'
import { formatInTimeZone } from 'date-fns-tz'

export default async function AdminFixturesPage() {
  const profile = await getUserProfile()
  if (profile?.role !== 'admin') redirect('/home')
  const locale = (profile?.language as Locale) || 'en'
  const t = (key: any) => getTranslation(locale, key)
  const supabase = await createClient()

  const { data: teams } = await supabase.from('teams').select('*').order('name')
  const { data: rounds } = await supabase.from('rounds').select('*').order('round_order')
  const { data: fixtures } = await supabase.from('fixtures').select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)').order('kickoff_time', { ascending: false })

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 -mt-4 z-10 space-y-4">
        <Link href="/admin" className="flex items-center gap-2 text-sbk-blue font-bold text-sm px-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-sbk-navy mb-6">Create Fixture</h2>
          
          <form action={async (formData) => {
            'use server'
            await createFixture(formData)
          }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Round</label>
              <select name="round_id" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900" required>
                <option value="">Select Round</option>
                {rounds?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Home Team</label>
                <select name="home_team_id" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900" required>
                  <option value="">Home Team</option>
                  {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Away Team</label>
                <select name="away_team_id" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900" required>
                  <option value="">Away Team</option>
                  {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kickoff Time (Local Time)</label>
              <input type="datetime-local" name="kickoff_time" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900" required />
            </div>

            <button type="submit" className="w-full bg-sbk-navy text-white font-bold py-3 rounded-xl mt-4">
              Create Match
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-sbk-navy mb-4">Existing Fixtures</h2>
          <div className="space-y-3">
            {fixtures?.map(f => (
              <div key={f.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <div className="font-bold text-sm text-gray-900">{f.home_team?.short_name || 'TBD'} vs {f.away_team?.short_name || 'TBD'}</div>
                  <div className="text-xs text-gray-500">
                    {f.kickoff_time ? formatInTimeZone(new Date(f.kickoff_time), 'Asia/Kolkata', "MMM d, yyyy h:mm a") + ' IST' : 'TBD'}
                  </div>
                  <div className="text-xs font-bold mt-1 text-sbk-blue uppercase">{f.status}</div>
                </div>
                <form action={async () => {
                  'use server'
                  await deleteFixture(f.id)
                }}>
                  <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ))}
            {fixtures?.length === 0 && <p className="text-sm text-gray-500">No fixtures found.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
