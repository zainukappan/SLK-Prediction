'use client'

import { Locale } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { updateLanguage } from './actions'

export function LanguageToggle({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleToggle = (newLocale: Locale) => {
    if (newLocale === currentLocale) return
    startTransition(async () => {
      await updateLanguage(newLocale)
      router.refresh()
    })
  }

  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
      <button
        onClick={() => handleToggle('en')}
        disabled={isPending}
        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
          currentLocale === 'en' ? 'bg-white shadow-sm text-sbk-blue' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        English
      </button>
      <button
        onClick={() => handleToggle('ml')}
        disabled={isPending}
        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
          currentLocale === 'ml' ? 'bg-white shadow-sm text-sbk-blue' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        മലയാളം
      </button>
    </div>
  )
}
