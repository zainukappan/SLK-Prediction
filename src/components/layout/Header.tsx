'use client'

import Image from 'next/image'
import { getTranslation, Locale } from '@/lib/i18n'

export function Header({ locale }: { locale: Locale }) {
  return (
    <header className="bg-sbk-navy text-white pt-12 pb-4 px-4 flex flex-col items-center justify-center relative rounded-b-3xl shadow-lg">
      <div className="absolute top-4 right-4 flex bg-sbk-blue/50 rounded-full overflow-hidden border border-sbk-blue">
        <span className={`px-2 py-1 text-xs cursor-pointer ${locale === 'ml' ? 'bg-sbk-yellow text-sbk-navy font-bold' : 'text-gray-300'}`}>മലയാളം</span>
        <span className={`px-2 py-1 text-xs cursor-pointer ${locale === 'en' ? 'bg-sbk-yellow text-sbk-navy font-bold' : 'text-gray-300'}`}>EN</span>
      </div>
      <Image src="/sbk-logo.svg" alt="SBK" width={80} height={80} className="rounded-full border-2 border-sbk-yellow mb-3 z-10 bg-white" />
      <h1 className="text-xl font-bold uppercase">SLK Prediction Contest</h1>
      <p className="text-[10px] tracking-widest text-gray-300 uppercase mt-1">Fans Predict. Football Unites.</p>
    </header>
  )
}
