'use client'

import Image from 'next/image'
import { Locale, getTranslation } from '@/lib/i18n'
import { useTransition } from 'react'
import { updateLanguage } from '@/app/profile/actions'
import { useRouter } from 'next/navigation'

export function Header({ locale = 'en' }: { locale: Locale }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleToggle = (newLocale: Locale) => {
    if (newLocale === locale || isPending) return
    startTransition(async () => {
      await updateLanguage(newLocale)
      router.refresh()
    })
  }

  const t = (key: any) => getTranslation(locale, key)

  return (
    <header className="bg-sbk-navy text-white pt-12 pb-5 px-4 flex flex-col items-center justify-center relative rounded-b-3xl shadow-lg">
      {/* Language Switcher */}
      <div 
        className="absolute top-4 right-4 flex bg-sbk-blue/70 rounded-full p-0.5 border border-sbk-blue shadow-inner"
        role="group"
        aria-label="Language selection"
      >
        <button
          type="button"
          onClick={() => handleToggle('ml')}
          disabled={isPending}
          className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sbk-yellow ${
            locale === 'ml' ? 'bg-sbk-yellow text-sbk-navy shadow-sm' : 'text-gray-300 hover:text-white'
          }`}
          aria-pressed={locale === 'ml'}
          aria-label="Switch to Malayalam"
        >
          മലയാളം
        </button>
        <button
          type="button"
          onClick={() => handleToggle('en')}
          disabled={isPending}
          className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sbk-yellow ${
            locale === 'en' ? 'bg-sbk-yellow text-sbk-navy shadow-sm' : 'text-gray-300 hover:text-white'
          }`}
          aria-pressed={locale === 'en'}
          aria-label="Switch to English"
        >
          EN
        </button>
      </div>

      {/* SBK Logo */}
      <div className="relative mb-3 z-10">
        <Image
          src="/sbk-logo.svg"
          alt="Soccer Blues of Keralam Logo"
          width={80}
          height={80}
          className="rounded-full border-2 border-sbk-yellow bg-white p-0.5 shadow-md"
          priority
        />
      </div>

      <h1 className="text-xl font-black uppercase tracking-wider text-center">
        {t('contestTitle')}
      </h1>
      <p className="text-[11px] font-semibold tracking-widest text-sbk-yellow uppercase mt-1 text-center">
        {t('slogan')}
      </p>
    </header>
  )
}
