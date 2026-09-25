'use client'

import { useState, useTransition } from 'react'
import { finalizeOrCorrectResult, getResultPreviewAction } from './actions'
import { getTeamShortName, Locale } from '@/lib/i18n'
import { formatInTimeZone } from 'date-fns-tz'
import { 
  Trophy, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ShieldAlert
} from 'lucide-react'

export function ResultsManager({
  fixtures,
  locale,
}: {
  fixtures: any[]
  locale: Locale
}) {
  const [filter, setFilter] = useState<'awaiting' | 'completed' | 'all'>('awaiting')
  const [scores, setScores] = useState<Record<string, { home: string; away: string; status: string; reason: string }>>({})
  const [previews, setPreviews] = useState<Record<string, any>>({})
  const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const filteredFixtures = fixtures.filter((f) => {
    if (filter === 'awaiting') return !f.finalized && f.status !== 'cancelled'
    if (filter === 'completed') return f.finalized
    return true
  })

  const getFixtureState = (fixtureId: string, defaultHome: any, defaultAway: any, defaultStatus: string) => {
    return scores[fixtureId] || {
      home: defaultHome !== null && defaultHome !== undefined ? String(defaultHome) : '0',
      away: defaultAway !== null && defaultAway !== undefined ? String(defaultAway) : '0',
      status: defaultStatus || 'completed',
      reason: '',
    }
  }

  const handleScoreChange = (fixtureId: string, field: string, val: string, f: any) => {
    const current = getFixtureState(fixtureId, f.home_score, f.away_score, f.status)
    setScores((prev) => ({
      ...prev,
      [fixtureId]: {
        ...current,
        [field]: val,
      },
    }))
    // Clear old preview if scores change
    if (field === 'home' || field === 'away') {
      setPreviews((prev) => {
        const next = { ...prev }
        delete next[fixtureId]
        return next
      })
    }
  }

  const handlePreview = async (fixture: any) => {
    const state = getFixtureState(fixture.id, fixture.home_score, fixture.away_score, fixture.status)
    const h = parseInt(state.home)
    const a = parseInt(state.away)

    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setNotification({ type: 'error', message: 'Please enter valid non-negative integer scores for preview.' })
      return
    }

    setPreviewLoading((prev) => ({ ...prev, [fixture.id]: true }))
    try {
      const res = await getResultPreviewAction(fixture.id, h, a)
      if (res.error) {
        setNotification({ type: 'error', message: res.error })
      } else {
        setPreviews((prev) => ({ ...prev, [fixture.id]: res }))
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to generate preview' })
    } finally {
      setPreviewLoading((prev) => ({ ...prev, [fixture.id]: false }))
    }
  }

  const handleSubmit = (fixture: any) => {
    const state = getFixtureState(fixture.id, fixture.home_score, fixture.away_score, fixture.status)

    if (fixture.finalized && (!state.reason || state.reason.trim().length === 0)) {
      setNotification({
        type: 'error',
        message: 'A reason is required to correct an already finalized match result.',
      })
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('fixtureId', fixture.id)
      formData.set('homeScore', state.home)
      formData.set('awayScore', state.away)
      formData.set('status', state.status)
      formData.set('reason', state.reason)

      const res = await finalizeOrCorrectResult(formData)
      if (res.error) {
        setNotification({ type: 'error', message: res.error })
      } else {
        setNotification({
          type: 'success',
          message: fixture.finalized
            ? 'Score corrected and all member points/standings recomputed!'
            : 'Match finalized and points awarded successfully!',
        })
        setPreviews((prev) => {
          const next = { ...prev }
          delete next[fixture.id]
          return next
        })
        setTimeout(() => setNotification(null), 4000)
      }
    })
  }

  return (
    <div className="space-y-4">
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
        <button
          onClick={() => setFilter('awaiting')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            filter === 'awaiting' ? 'bg-white text-sbk-navy shadow-sm' : 'text-gray-600'
          }`}
        >
          Awaiting Finalization ({fixtures.filter((f) => !f.finalized && f.status !== 'cancelled').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            filter === 'completed' ? 'bg-white text-sbk-navy shadow-sm' : 'text-gray-600'
          }`}
        >
          Finalized / Correct ({fixtures.filter((f) => f.finalized).length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            filter === 'all' ? 'bg-white text-sbk-navy shadow-sm' : 'text-gray-600'
          }`}
        >
          All ({fixtures.length})
        </button>
      </div>

      {/* Fixtures Scoring List */}
      <div className="space-y-4">
        {filteredFixtures.map((match) => {
          const state = getFixtureState(match.id, match.home_score, match.away_score, match.status)
          const preview = previews[match.id]
          const isLoadingPreview = previewLoading[match.id]

          return (
            <div
              key={match.id}
              className={`p-4 rounded-2xl border shadow-sm space-y-4 transition-colors ${
                match.finalized ? 'bg-gray-50/80 border-gray-200' : 'bg-white border-blue-100'
              }`}
            >
              {/* Match Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">
                      {getTeamShortName(match.home_team, locale)} vs {getTeamShortName(match.away_team, locale)}
                    </span>
                    {match.finalized && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Finalized ({match.home_score} - {match.away_score})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Kickoff: {formatInTimeZone(new Date(match.kickoff_time), 'Asia/Kolkata', 'MMM d, yyyy h:mm a')} IST
                  </p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    match.status === 'completed'
                      ? 'bg-gray-200 text-gray-700'
                      : match.status === 'live'
                      ? 'bg-red-100 text-red-700 animate-pulse'
                      : match.status === 'postponed'
                      ? 'bg-amber-100 text-amber-800'
                      : match.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-sbk-blue'
                  }`}
                >
                  {match.status}
                </span>
              </div>

              {/* Score Input Controls */}
              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
                <div className="flex flex-col items-center flex-1">
                  <span className="text-[11px] font-bold text-gray-600 mb-1 truncate max-w-[100px]">
                    {getTeamShortName(match.home_team, locale)}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={state.home}
                    onChange={(e) => handleScoreChange(match.id, 'home', e.target.value, match)}
                    className="w-16 h-11 text-center font-black text-xl rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sbk-blue"
                  />
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-gray-400">VS</span>
                  <select
                    value={state.status}
                    onChange={(e) => handleScoreChange(match.id, 'status', e.target.value, match)}
                    className="p-1.5 border border-gray-200 rounded-lg text-xs font-semibold bg-gray-50"
                  >
                    <option value="completed">Completed (Finalize)</option>
                    <option value="live">Live / In Progress</option>
                    <option value="upcoming">Scheduled</option>
                    <option value="postponed">Postponed (0 pts)</option>
                    <option value="cancelled">Cancelled (0 pts)</option>
                  </select>
                </div>

                <div className="flex flex-col items-center flex-1">
                  <span className="text-[11px] font-bold text-gray-600 mb-1 truncate max-w-[100px]">
                    {getTeamShortName(match.away_team, locale)}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={state.away}
                    onChange={(e) => handleScoreChange(match.id, 'away', e.target.value, match)}
                    className="w-16 h-11 text-center font-black text-xl rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sbk-blue"
                  />
                </div>
              </div>

              {/* Correction Reason Requirement (if already finalized) */}
              {match.finalized && (
                <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    Correction Reason (Mandatory for finalized matches)
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Official league score correction / VAR reversal / Typo fix..."
                    value={state.reason}
                    onChange={(e) => handleScoreChange(match.id, 'reason', e.target.value, match)}
                    className="w-full p-2 text-xs border border-amber-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-amber-700">
                    This reason will be logged in the private admin audit log with previous score history.
                  </p>
                </div>
              )}

              {/* Action Buttons: Preview & Finalize */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePreview(match)}
                  disabled={isLoadingPreview || isPending}
                  className="flex-1 bg-white hover:bg-gray-50 text-sbk-navy border border-gray-300 text-xs font-bold py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-sbk-blue" />
                  {isLoadingPreview ? 'Simulating...' : 'Preview Changes'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit(match)}
                  disabled={isPending}
                  className={`flex-1 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 ${
                    match.finalized
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-sbk-blue hover:bg-blue-900'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  {isPending
                    ? 'Processing...'
                    : match.finalized
                    ? 'Apply Correction'
                    : 'Finalize & Award Points'}
                </button>
              </div>

              {/* Standings Impact Preview Section */}
              {preview && (
                <div className="mt-3 p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                  <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                    <span className="text-xs font-bold text-sbk-navy flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-sbk-blue" />
                      Projected Standings Impact ({preview.impacts.length} predictions)
                    </span>
                    <button
                      onClick={() =>
                        setPreviews((prev) => {
                          const n = { ...prev }
                          delete n[match.id]
                          return n
                        })
                      }
                      className="text-[10px] text-gray-500 hover:underline"
                    >
                      Hide Preview
                    </button>
                  </div>

                  {preview.impacts.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {preview.impacts.map((item: any) => (
                        <div
                          key={item.userId}
                          className="flex justify-between items-center p-2 rounded-lg bg-white border border-blue-100 text-xs"
                        >
                          <div>
                            <span className="font-bold text-gray-800">{item.userName}</span>
                            <span className="text-[10px] text-gray-500 ml-1.5">
                              (Pred: {item.predictedScore})
                            </span>
                            <div className="text-[10px] text-gray-500">
                              {item.reason}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="font-black text-gray-900">
                                {item.newPoints} pts
                              </span>
                              {item.pointsDelta !== 0 && (
                                <span
                                  className={`text-[10px] font-bold px-1 rounded ${
                                    item.pointsDelta > 0
                                      ? 'text-emerald-700 bg-emerald-50'
                                      : 'text-red-700 bg-red-50'
                                  }`}
                                >
                                  {item.pointsDelta > 0 ? `+${item.pointsDelta}` : item.pointsDelta}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-500 flex items-center justify-end gap-1">
                              <span>Rank #{item.currentRank}</span>
                              <span>&rarr;</span>
                              <span className="font-bold text-sbk-blue">#{item.projectedRank}</span>
                              {item.rankDelta > 0 ? (
                                <TrendingUp className="w-3 h-3 text-emerald-600" />
                              ) : item.rankDelta < 0 ? (
                                <TrendingDown className="w-3 h-3 text-red-600" />
                              ) : (
                                <Minus className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-2">
                      No member predictions submitted for this fixture.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filteredFixtures.length === 0 && (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-100 text-gray-500 text-xs">
            No fixtures match this filter.
          </div>
        )}
      </div>
    </div>
  )
}
