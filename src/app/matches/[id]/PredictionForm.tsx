'use client'

import { useState, useTransition } from 'react'
import { getTranslation, Locale } from '@/lib/i18n'
import { savePrediction } from './actions'
import { CheckCircle2, Lock } from 'lucide-react'

export function PredictionForm({ 
  matchId, 
  initialHome, 
  initialAway, 
  isLocked, 
  locale,
  hasExisting
}: { 
  matchId: string, 
  initialHome: number, 
  initialAway: number, 
  isLocked: boolean,
  locale: Locale,
  hasExisting: boolean
}) {
  const [homeScore, setHomeScore] = useState(initialHome)
  const [awayScore, setAwayScore] = useState(initialAway)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const t = (key: any) => getTranslation(locale, key)

  const handleSave = () => {
    if (isLocked) return
    startTransition(async () => {
      setStatus('idle')
      const result = await savePrediction(matchId, homeScore, awayScore)
      if (result.error) {
        setStatus('error')
      } else {
        setStatus('success')
        setTimeout(() => setStatus('idle'), 3000)
      }
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center gap-4 mb-8 px-4">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-2 border border-gray-200">
          <button 
            onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
            disabled={isLocked || homeScore === 0}
            className="w-10 h-10 rounded-lg bg-white shadow-sm font-bold text-xl text-sbk-blue disabled:opacity-50 disabled:bg-gray-100"
          >-</button>
          <span className="w-8 text-center text-3xl font-black">{homeScore}</span>
          <button 
            onClick={() => setHomeScore(homeScore + 1)}
            disabled={isLocked}
            className="w-10 h-10 rounded-lg bg-white shadow-sm font-bold text-xl text-sbk-blue disabled:opacity-50 disabled:bg-gray-100"
          >+</button>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-2 border border-gray-200">
          <button 
            onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
            disabled={isLocked || awayScore === 0}
            className="w-10 h-10 rounded-lg bg-white shadow-sm font-bold text-xl text-sbk-blue disabled:opacity-50 disabled:bg-gray-100"
          >-</button>
          <span className="w-8 text-center text-3xl font-black">{awayScore}</span>
          <button 
            onClick={() => setAwayScore(awayScore + 1)}
            disabled={isLocked}
            className="w-10 h-10 rounded-lg bg-white shadow-sm font-bold text-xl text-sbk-blue disabled:opacity-50 disabled:bg-gray-100"
          >+</button>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={isLocked || isPending}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-sm ${
          isLocked 
            ? 'bg-gray-100 text-gray-400' 
            : status === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-sbk-yellow text-sbk-navy hover:bg-yellow-500'
        }`}
      >
        {isLocked ? (
          <><Lock className="w-5 h-5" /> Locked</>
        ) : status === 'success' ? (
          <><CheckCircle2 className="w-5 h-5" /> {t('predictionSaved')}</>
        ) : isPending ? (
          "Saving..."
        ) : (
          <><Lock className="w-5 h-5" /> {hasExisting ? 'Update Prediction' : t('savePrediction')}</>
        )}
      </button>
      
      {status === 'error' && (
        <p className="text-red-500 text-center text-sm mt-2 font-semibold">Failed to save prediction.</p>
      )}
    </div>
  )
}
