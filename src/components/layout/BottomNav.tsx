'use client'

import { Home, CalendarDays, Trophy, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()

  // Hide nav on auth pages or admin pages if desired
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin')) {
    return null
  }

  const navItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/matches', icon: CalendarDays, label: 'Matches' },
    { href: '/rank', icon: Trophy, label: 'Rank' },
    { href: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="fixed bottom-0 w-full max-w-md md:max-w-3xl lg:max-w-5xl bg-white border-t border-gray-200 pb-safe z-50 left-1/2 -translate-x-1/2">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-sbk-blue" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-sbk-blue")} />
              <span className="text-[10px] font-medium">{item.label}</span>
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
