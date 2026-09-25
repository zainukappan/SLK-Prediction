'use client'

import { useState, useTransition } from 'react'
import { getTranslation, Locale } from '@/lib/i18n'
import { savePrediction } from './actions'
import { CheckCircle2, Lock, AlertCircle, Loader2 } from 'lucide-react'

export function PredictionForm({ 
  matchId, 
  initialHome, 
  initialAway, 
  isLocked, 
  locale,
  hasExisting,
  homeTeamName,
  awayTeamName
}: { 
  matchId: string
  initialHome: number
  initialAway: number
  isLocked: boolean
  locale: Locale
  hasExisting: boolean
  homeTeamName?: string
  awayTeamName?: string
}) {
  const [homeScore, setHomeScore] = useState(Math.max(0, initialHome))
  const [awayScore, setAwayScore] = useState(Math.max(0, initialAway))
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const t = (key: any) => getTranslation(locale, key)

  const handleSave = () => {
    if (isLocked || isPending) return
    startTransition(async () => {
      setStatus('idle')
      setErrorMessage(null)
      const result = await savePrediction(matchId, homeScore, awayScore)
      if (result.error) {
        setStatus('error')
        setErrorMessage(result.error)
      } else {
        setStatus('success')
        setTimeout(() => setStatus('idle'), 4000)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Score Controls */}
      <div className="flex justify-around items-center gap-3 px-2">
        {/* Home Team Score */}
        <div className="flex flex-col items-center space-y-2">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide truncate max-w-[120px] text-center">
            {homeTeamName || 'Home'}
          </span>
          <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-2 border border-gray-200 shadow-inner">
            <button 
              type="button"
              onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
              disabled={isLocked || isPending || homeScore === 0}
              aria-label={`Decrease ${homeTeamName || 'Home'} score`}
              className="w-10 h-10 rounded-xl bg-white shadow-sm font-black text-xl text-sbk-blue disabled:opacity-30 disabled:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sbk-yellow active:scale-95 transition-all"
            >
              -
            </button>
            <input
              type="number"
              min={0}
              value={homeScore}
              disabled={isLocked || isPending}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                setHomeScore(isNaN(val) ? 0 : Math.max(0, val))
              }}
              aria-label={`${homeTeamName || 'Home'} predicted score`}
              className="w-12 text-center text-3xl font-black text-gray-900 bg-transparent focus:outline-none"
            />
            <button 
              type="button"
              onClick={() => setHomeScore(homeScore + 1)}
              disabled={isLocked || isPending}
              aria-label={`Increase ${homeTeamName || 'Home'} score`}
              className="w-10 h-10 rounded-xl bg-white shadow-sm font-black text-xl text-sbk-blue disabled:opacity-30 disabled:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sbk-yellow active:scale-95 transition-all"
            >
              +
            </button>
          </div>
        </div>

        <span className="text-gray-300 font-black text-xl self-end pb-4">:</span>

        {/* Away Team Score */}
        <div className="flex flex-col items-center space-y-2">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide truncate max-w-[120px] text-center">
            {awayTeamName || 'Away'}
          </span>
          <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-2 border border-gray-200 shadow-inner">
            <button 
              type="button"
              onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
              disabled={isLocked || isPending || awayScore === 0}
              aria-label={`Decrease ${awayTeamName || 'Away'} score`}
              className="w-10 h-10 rounded-xl bg-white shadow-sm font-black text-xl text-sbk-blue disabled:opacity-30 disabled:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sbk-yellow active:scale-95 transition-all"
            >
              -
            </button>
            <input
              type="number"
              min={0}
              value={awayScore}
              disabled={isLocked || isPending}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                setAwayScore(isNaN(val) ? 0 : Math.max(0, val))
              }}
              aria-label={`${awayTeamName || 'Away'} predicted score`}
              className="w-12 text-center text-3xl font-black text-gray-900 bg-transparent focus:outline-none"
            />
            <button 
              type="button"
              onClick={() => setAwayScore(awayScore + 1)}
              disabled={isLocked || isPending}
              aria-label={`Increase ${awayTeamName || 'Away'} score`}
              className="w-10 h-10 rounded-xl bg-white shadow-sm font-black text-xl text-sbk-blue disabled:opacity-30 disabled:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sbk-yellow active:scale-95 transition-all"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button 
        type="button"
        onClick={handleSave}
        disabled={isLocked || isPending}
        className={`w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sbk-yellow active:scale-[0.99] ${
          isLocked 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
            : status === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-sbk-yellow text-sbk-navy hover:bg-yellow-500'
        }`}
      >
        {isLocked ? (
          <><Lock className="w-5 h-5" /> {t('locked')}</>
        ) : isPending ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> {t('saving')}</>
        ) : status === 'success' ? (
          <><CheckCircle2 className="w-5 h-5" /> {t('predictionSaved')}</>
        ) : (
          <>{hasExisting ? t('updatePrediction') : t('savePrediction')}</>
        )}
      </button>

      {/* Feedback Messages */}
      {status === 'error' && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage || t('error')}</span>
        </div>
      )}

      {hasExisting && !isLocked && (
        <p className="text-[11px] text-gray-500 text-center font-medium">
          You have an existing prediction. You can adjust and save it anytime before the deadline.
        </p>
      )}
    </div>
  )
}
