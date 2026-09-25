'use client'

import { useState, useTransition } from 'react'
import { createFixture, updateFixtureSchedule, deleteFixture, saveTeam, saveRound } from './actions'
import { isMissingMalayalamName, getTeamName, getTeamShortName, Locale } from '@/lib/i18n'
import { formatInTimeZone } from 'date-fns-tz'
import { 
  Calendar, 
  Trash2, 
  Clock, 
  ShieldAlert, 
  PlusCircle, 
  AlertTriangle,
  FolderPlus,
  Edit2
} from 'lucide-react'

export function FixtureManager({
  teams,
  rounds,
  fixtures,
  locale
}: {
  teams: any[]
  rounds: any[]
  fixtures: any[]
  locale: Locale
}) {
  const [activeTab, setActiveTab] = useState<'fixtures' | 'teams' | 'rounds'>('fixtures')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [rescheduleFixtureId, setRescheduleFixtureId] = useState<string | null>(null)
  const [editingTeam, setEditingTeam] = useState<any | null>(null)

  const handleCreateFixture = (formData: FormData) => {
    startTransition(async () => {
      const res = await createFixture(formData)
      if (res.error) setMessage(`Error: ${res.error}`)
      else {
        setMessage('Fixture created successfully!')
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  const handleReschedule = (formData: FormData) => {
    startTransition(async () => {
      const res = await updateFixtureSchedule(formData)
      if (res.error) setMessage(`Error: ${res.error}`)
      else {
        setMessage('Match rescheduled! IST kickoff and deadlines updated.')
        setRescheduleFixtureId(null)
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this fixture?')) return
    startTransition(async () => {
      const res = await deleteFixture(id)
      if (res.error) setMessage(`Error: ${res.error}`)
      else setMessage('Fixture deleted.')
    })
  }

  const handleSaveTeam = (formData: FormData) => {
    startTransition(async () => {
      const res = await saveTeam(formData)
      if (res.error) setMessage(`Error: ${res.error}`)
      else {
        setMessage('Team saved successfully!')
        setEditingTeam(null)
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  const handleSaveRound = (formData: FormData) => {
    startTransition(async () => {
      const res = await saveRound(formData)
      if (res.error) setMessage(`Error: ${res.error}`)
      else {
        setMessage('Round saved successfully!')
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="p-3 bg-blue-50 text-sbk-blue text-xs font-bold rounded-xl border border-blue-200">
          {message}
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
        <button
          onClick={() => setActiveTab('fixtures')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'fixtures' ? 'bg-white text-sbk-navy shadow-sm' : 'text-gray-600'
          }`}
        >
          Fixtures ({fixtures.length})
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'teams' ? 'bg-white text-sbk-navy shadow-sm' : 'text-gray-600'
          }`}
        >
          Teams ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('rounds')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'rounds' ? 'bg-white text-sbk-navy shadow-sm' : 'text-gray-600'
          }`}
        >
          Rounds ({rounds.length})
        </button>
      </div>

      {/* Tab 1: Fixtures */}
      {activeTab === 'fixtures' && (
        <div className="space-y-5">
          {/* Create Match */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-sbk-navy mb-4 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-sbk-blue" />
              Create New Fixture
            </h3>

            <form action={handleCreateFixture} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Round</label>
                <select name="round_id" className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900" required>
                  <option value="">Select Round</option>
                  {rounds.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.name_ml ? `(${r.name_ml})` : ''} - Order #{r.round_order}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Home Team</label>
                  <select name="home_team_id" className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900" required>
                    <option value="">Select Home</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.short_name}) {isMissingMalayalamName(t) ? '⚠️ [ML Missing]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Away Team</label>
                  <select name="away_team_id" className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900" required>
                    <option value="">Select Away</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.short_name}) {isMissingMalayalamName(t) ? '⚠️ [ML Missing]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Kickoff Time (Local Time)</label>
                <input type="datetime-local" name="kickoff_time" className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900" required />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-sbk-navy hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm disabled:opacity-50"
              >
                {isPending ? 'Creating...' : 'Create Match Fixture'}
              </button>
            </form>
          </div>

          {/* Existing Fixtures */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-sbk-navy mb-4">Existing Fixtures</h3>
            
            <div className="space-y-3">
              {fixtures.map((f) => {
                const isHomeMlMissing = isMissingMalayalamName(f.home_team)
                const isAwayMlMissing = isMissingMalayalamName(f.away_team)
                const isReschedulingThis = rescheduleFixtureId === f.id

                return (
                  <div key={f.id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm text-gray-900">
                          {f.home_team?.short_name || 'TBD'} vs {f.away_team?.short_name || 'TBD'}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {f.kickoff_time ? formatInTimeZone(new Date(f.kickoff_time), 'Asia/Kolkata', "MMM d, yyyy h:mm a") + ' IST' : 'TBD'}
                        </div>

                        {f.is_rescheduled && (
                          <div className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1 inline-block">
                            Rescheduled: {f.rescheduled_reason || 'Schedule changed'}
                          </div>
                        )}

                        {(isHomeMlMissing || isAwayMlMissing) && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            Missing Malayalam name for: {isHomeMlMissing ? f.home_team?.name : ''} {isAwayMlMissing ? f.away_team?.name : ''}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          f.finalized ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {f.status}
                        </span>

                        <button
                          onClick={() => setRescheduleFixtureId(isReschedulingThis ? null : f.id)}
                          className="p-1.5 text-sbk-blue hover:bg-blue-50 rounded-lg text-xs"
                          title="Reschedule Kickoff"
                        >
                          <Clock className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs"
                          title="Delete Fixture"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Reschedule Form Drawer */}
                    {isReschedulingThis && (
                      <form action={handleReschedule} className="mt-3 p-3 bg-white rounded-xl border border-blue-200 space-y-2">
                        <input type="hidden" name="fixtureId" value={f.id} />
                        <h4 className="text-xs font-bold text-sbk-blue">Reschedule Match Kickoff</h4>
                        <p className="text-[10px] text-gray-500">
                          Recalculates prediction deadline (5 mins before new kickoff). Preserves all existing member predictions.
                        </p>
                        
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase">New Kickoff (Local)</label>
                          <input
                            type="datetime-local"
                            name="newKickoffTime"
                            required
                            className="w-full p-2 border rounded-lg text-xs text-gray-900 bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase">Reschedule Reason (Visible to members)</label>
                          <input
                            type="text"
                            name="rescheduleReason"
                            placeholder="e.g. Broadcast delay, Weather postponement..."
                            className="w-full p-2 border rounded-lg text-xs text-gray-900 bg-gray-50"
                          />
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 bg-sbk-blue text-white text-xs font-bold py-1.5 rounded-lg shadow-sm"
                          >
                            Save Rescheduled Kickoff
                          </button>
                          <button
                            type="button"
                            onClick={() => setRescheduleFixtureId(null)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )
              })}

              {fixtures.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-6">No fixtures created yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Teams Management */}
      {activeTab === 'teams' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-sbk-navy mb-4 flex items-center justify-between">
              <span>{editingTeam ? 'Edit Team' : 'Add New Team'}</span>
              {editingTeam && (
                <button
                  onClick={() => setEditingTeam(null)}
                  className="text-xs text-gray-500 underline font-normal"
                >
                  Cancel Edit
                </button>
              )}
            </h3>

            <form action={handleSaveTeam} className="space-y-3">
              {editingTeam && <input type="hidden" name="teamId" value={editingTeam.id} />}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Team Name (EN) *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingTeam?.name || ''}
                    placeholder="e.g. Calicut FC"
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Short Name (EN) *</label>
                  <input
                    type="text"
                    name="short_name"
                    required
                    maxLength={5}
                    defaultValue={editingTeam?.short_name || ''}
                    placeholder="e.g. CFC"
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Team Name (Malayalam)</label>
                  <input
                    type="text"
                    name="name_ml"
                    defaultValue={editingTeam?.name_ml || ''}
                    placeholder="e.g. കോഴിക്കോട് എഫ്.സി"
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Short Name (ML)</label>
                  <input
                    type="text"
                    name="short_name_ml"
                    maxLength={6}
                    defaultValue={editingTeam?.short_name_ml || ''}
                    placeholder="e.g. സി.എഫ്.സി"
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Badge / Logo URL (Optional)</label>
                <input
                  type="url"
                  name="badge_url"
                  defaultValue={editingTeam?.badge_url || editingTeam?.logo_url || ''}
                  placeholder="https://example.com/badge.png"
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-sbk-navy hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm disabled:opacity-50"
              >
                {editingTeam ? 'Update Team' : 'Save Team'}
              </button>
            </form>
          </div>

          {/* Teams List */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-sbk-navy mb-3">All Teams</h3>
            <div className="space-y-2">
              {teams.map((t) => {
                const isMlMissing = isMissingMalayalamName(t)
                return (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">{t.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">{t.short_name}</span>
                        {isMlMissing && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Missing Malayalam
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        ML: {t.name_ml || '(None)'} | Short ML: {t.short_name_ml || '(None)'}
                      </p>
                    </div>

                    <button
                      onClick={() => setEditingTeam(t)}
                      className="p-1.5 text-sbk-blue hover:bg-blue-50 rounded-lg"
                      title="Edit Team"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Rounds Management */}
      {activeTab === 'rounds' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-sbk-navy mb-4">Add / Order Rounds</h3>
            <form action={handleSaveRound} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Order #</label>
                  <input
                    type="number"
                    name="round_order"
                    required
                    min={1}
                    defaultValue={rounds.length + 1}
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Round Name (EN) *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Round 1 / Quarter Final"
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Round Name (Malayalam)</label>
                <input
                  type="text"
                  name="name_ml"
                  placeholder="e.g. റൗണ്ട് 1"
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-sbk-navy text-white font-bold py-2.5 rounded-xl text-xs shadow-sm disabled:opacity-50"
              >
                Save Round
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-sbk-navy mb-3">Rounds in Sequence</h3>
            <div className="space-y-2">
              {rounds.map(r => (
                <div key={r.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-sbk-navy text-white text-xs font-bold flex items-center justify-center">
                      {r.round_order}
                    </span>
                    <div>
                      <p className="font-bold text-xs text-gray-900">{r.name}</p>
                      {r.name_ml && <p className="text-[10px] text-gray-500">{r.name_ml}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
