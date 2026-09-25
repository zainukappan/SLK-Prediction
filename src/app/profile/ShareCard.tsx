'use client'

import { useRef, useState, useEffect } from 'react'
import * as htmlToImage from 'html-to-image'
import download from 'downloadjs'
import { Share2, Download, CheckCircle2, Info, Loader2 } from 'lucide-react'
import { getTranslation, Locale } from '@/lib/i18n'

export function ShareCard({ 
  name, 
  rank, 
  points, 
  exact = 0,
  outcome = 0,
  sharedRankDisplay,
  locale = 'en'
}: { 
  name: string
  rank: number
  points: number
  exact?: number
  outcome?: number
  sharedRankDisplay?: string
  locale: Locale 
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [canShareFile, setCanShareFile] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null)
  const t = (key: any) => getTranslation(locale, key)

  useEffect(() => {
    // Check if navigator.canShare with files is supported
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
      try {
        const dummyFile = new File([''], 'test.png', { type: 'image/png' })
        if (navigator.canShare({ files: [dummyFile] })) {
          setCanShareFile(true)
        }
      } catch (e) {
        setCanShareFile(false)
      }
    }
  }, [])

  const generatePngBlob = async (): Promise<{ blob: Blob; dataUrl: string } | null> => {
    if (!cardRef.current) return null
    // Temporarily ensure card font and elements are fully rendered
    const dataUrl = await htmlToImage.toPng(cardRef.current, {
      quality: 1,
      pixelRatio: 2.5,
      cacheBust: true,
      skipFonts: false,
    })
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    return { blob, dataUrl }
  }

  const handleDownload = async () => {
    setIsGenerating(true)
    setFeedback(null)
    try {
      const result = await generatePngBlob()
      if (result) {
        download(result.dataUrl, `sbk-prediction-rank-${name.toLowerCase().replace(/\s+/g, '-')}.png`, 'image/png')
        setFeedback({ type: 'success', text: locale === 'ml' ? 'ചിത്രം ഡൗൺലോഡ് ചെയ്തു!' : 'PNG downloaded successfully!' })
        setTimeout(() => setFeedback(null), 4000)
      }
    } catch (err) {
      console.error('Download error:', err)
      setFeedback({ type: 'error', text: 'Failed to generate PNG image. Please try again.' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShare = async () => {
    if (!canShareFile) {
      // Fallback directly to download if sharing not supported
      await handleDownload()
      return
    }

    setIsGenerating(true)
    setFeedback(null)
    try {
      const result = await generatePngBlob()
      if (!result) throw new Error('Image generation failed')

      const file = new File([result.blob], 'sbk-rank.png', { type: 'image/png' })

      await navigator.share({
        files: [file],
        title: 'SBK SLK Prediction Contest Rank',
        text: `I scored ${points} points in the SBK SLK Prediction Contest! Current Rank: ${sharedRankDisplay || `#${rank}`}`,
      })

      // Only reached if user actually completed share
      setFeedback({ type: 'success', text: t('shared') })
      setTimeout(() => setFeedback(null), 4000)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User dismissed the native share sheet - do NOT claim success!
        setFeedback({ type: 'info', text: t('shareDismissed') })
        setTimeout(() => setFeedback(null), 3000)
      } else {
        console.error('Sharing failed, falling back to download:', err)
        // Offer download fallback
        handleDownload()
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const rankText = sharedRankDisplay || `#${rank}`

  return (
    <div className="flex flex-col items-center w-full">
      {/* Visual Rank Card Optimized for crisp PNG generation */}
      <div 
        ref={cardRef} 
        style={{
          fontFamily: "'Noto Sans Malayalam', 'Anek Malayalam', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          lineHeight: '1.4'
        }}
        className="w-[320px] h-[440px] bg-slate-900 rounded-3xl relative overflow-hidden flex flex-col items-center pt-8 px-4 border-2 border-amber-400/40 shadow-2xl"
      >
        {/* Subtle radial glow background */}
        <div 
          className="absolute inset-0 opacity-25 pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle at center, #1e3a8a 10%, #0f172a 80%)' }}
        />

        {/* Circular SBK Logo */}
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-sbk-yellow mb-3 z-10 p-1 shadow-lg shrink-0">
          <img src="/sbk-logo.svg" alt="SBK" className="w-full h-full rounded-full object-contain" />
        </div>
        
        {/* Bilingual Header Titles */}
        <h2 className="text-white font-black text-lg uppercase tracking-wider z-10 text-center leading-tight">
          {locale === 'ml' ? 'എസ്.ബി.കെ എസ്.എൽ.കെ' : 'SBK SLK PREDICTION'}
        </h2>
        <h3 className="text-sbk-yellow font-extrabold text-sm uppercase tracking-widest mb-4 z-10 text-center leading-tight">
          {locale === 'ml' ? 'പ്രവചന മത്സരം' : 'PREDICTION CONTEST'}
        </h3>
        
        {/* Card Body with Name, Rank & Points */}
        <div className="bg-white w-full rounded-2xl p-4 flex flex-col items-center z-10 shadow-xl border border-gray-100">
          <span className="font-black text-base text-sbk-navy mb-2 text-center line-clamp-1">
            {name}
          </span>

          <div className="flex justify-around items-center w-full border-t border-gray-100 pt-3">
            <div className="flex flex-col items-center flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {t('rank')}
              </span>
              <span className="text-2xl font-black text-sbk-blue mt-0.5">
                {rankText}
              </span>
            </div>

            <div className="w-px h-10 bg-gray-200" />

            <div className="flex flex-col items-center flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {t('points')}
              </span>
              <span className="text-2xl font-black text-sbk-navy mt-0.5">
                {points}
              </span>
            </div>
          </div>

          {/* Stats Bar: Exact Scores & Correct Outcomes */}
          <div className="flex justify-between w-full mt-3 pt-2 border-t border-gray-50 text-[10px] font-semibold text-gray-500 px-2">
            <span>{t('exactScores')}: <strong className="text-gray-800">{exact}</strong></span>
            <span>{t('correctOutcomes')}: <strong className="text-gray-800">{outcome}</strong></span>
          </div>
        </div>

        {/* Footer Slogan */}
        <div className="absolute bottom-4 text-[10px] font-bold text-amber-300/80 tracking-widest uppercase text-center w-full px-4 leading-normal">
          {locale === 'ml' ? 'ഫാൻസ് പ്രവചിക്കുന്നു. ഫുട്ബോൾ ഒന്നിപ്പിക്കുന്നു.' : 'Fans Predict. Football Unites.'}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-[320px] space-y-2 mt-5">
        {canShareFile ? (
          <>
            <button 
              type="button"
              onClick={handleShare}
              disabled={isGenerating}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.99]"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              <span>{t('shareOnWhatsApp')}</span>
            </button>
            <button 
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('downloadPng')}</span>
            </button>
          </>
        ) : (
          <button 
            type="button"
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full bg-sbk-blue hover:bg-blue-900 text-white font-black py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.99]"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{t('downloadPng')}</span>
          </button>
        )}
      </div>

      {/* User Feedback Toast */}
      {feedback && (
        <div 
          className={`mt-3 p-2.5 rounded-xl text-xs font-bold max-w-[320px] w-full flex items-center gap-2 ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : feedback.type === 'info'
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <Info className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}
    </div>
  )
}
