'use client'

import { useEffect, useState } from 'react'
import { Home, CalendarDays, Trophy, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getTranslation, Locale } from '@/lib/i18n'

export function BottomNav() {
  const pathname = usePathname()
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    // Read cookie if available
    const match = document.cookie.match(/(^|;\s*)sbk_lang=([^;]+)/)
    if (match && (match[2] === 'ml' || match[2] === 'en')) {
      setLocale(match[2] as Locale)
    }
  }, [pathname])

  // Hide nav on auth pages or admin pages if desired
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin')) {
    return null
  }

  const t = (key: any) => getTranslation(locale, key)

  const navItems = [
    { href: '/home', icon: Home, label: t('navHome') },
    { href: '/matches', icon: CalendarDays, label: t('navMatches') },
    { href: '/rank', icon: Trophy, label: t('navRank') },
    { href: '/profile', icon: User, label: t('navProfile') },
  ]

  return (
    <nav 
      aria-label="Main navigation" 
      className="fixed bottom-0 w-full max-w-md md:max-w-3xl lg:max-w-5xl bg-white/95 backdrop-blur-md border-t border-gray-200 pb-safe z-50 left-1/2 -translate-x-1/2 shadow-lg"
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-sbk-yellow",
                isActive ? "text-sbk-blue font-bold" : "text-gray-500 hover:text-gray-900 font-medium"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110 fill-sbk-blue/20 stroke-sbk-blue")} />
              <span className="text-[11px] leading-tight">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-1 bg-sbk-yellow rounded-t-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
