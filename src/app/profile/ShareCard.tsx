'use client'

import { useRef } from 'react'
import * as htmlToImage from 'html-to-image'
import download from 'downloadjs'
import { Share2, Download } from 'lucide-react'

export function ShareCard({ 
  name, 
  rank, 
  points, 
  locale 
}: { 
  name: string, 
  rank: number, 
  points: number, 
  locale: string 
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleShare = async () => {
    if (!cardRef.current) return
    
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 1, pixelRatio: 2 })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'sbk-rank.png', { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My SBK Prediction Rank',
          text: `Check out my rank in the SBK SLK Prediction Contest!`,
        })
      } else {
        // Fallback to download
        download(dataUrl, 'sbk-rank.png')
      }
    } catch (err) {
      console.error('Error generating image', err)
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* The visible card that will be converted to image */}
      <div 
        ref={cardRef} 
        className="w-[300px] h-[400px] bg-sbk-navy rounded-2xl relative overflow-hidden flex flex-col items-center pt-8 border border-gray-800 shadow-2xl"
      >
        <div className="absolute top-0 w-full h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #1e3a8a 0%, transparent 70%)' }}></div>
        
        {/* Logo */}
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border-4 border-sbk-yellow mb-4 z-10 p-1">
           <img src="/sbk-logo.svg" alt="SBK" className="w-full h-full rounded-full" />
        </div>
        
        <h2 className="text-white font-bold text-xl uppercase tracking-wider z-10">SBK SLK</h2>
        <h3 className="text-sbk-yellow font-bold text-lg uppercase tracking-widest mb-6 z-10">Prediction Contest</h3>
        
        <div className="bg-white w-[90%] rounded-xl p-4 flex flex-col items-center z-10 shadow-lg">
          <span className="font-bold text-lg text-sbk-navy mb-2">{name}</span>
          <div className="flex justify-between w-full px-4 border-t border-gray-100 pt-3">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rank</span>
              <span className="text-3xl font-black text-sbk-blue">#{rank}</span>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Points</span>
              <span className="text-3xl font-black text-sbk-navy">{points}</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-3 text-[8px] text-gray-400 tracking-widest uppercase text-center w-full">
          {locale === 'ml' ? 'ഫാൻസ് പ്രവചിക്കുന്നു. ഫുട്ബോൾ ഒന്നിപ്പിക്കുന്നു.' : 'Fans Predict. Football Unites.'}
        </div>
      </div>

      <button 
        onClick={handleShare}
        className="mt-6 w-full max-w-[300px] bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition shadow-md flex items-center justify-center gap-2"
      >
        <Share2 className="w-5 h-5" />
        Share on WhatsApp
      </button>
    </div>
  )
}
