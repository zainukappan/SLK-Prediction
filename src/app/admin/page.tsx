import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { getTranslation, Locale } from '@/lib/i18n'
import Link from 'next/link'
import { Users, Calendar, Trophy, AlertCircle } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const profile = await getUserProfile()
  
  if (profile?.role !== 'admin') {
    redirect('/home')
  }

  const locale = (profile?.language as Locale) || 'en'
  const t = (key: any) => getTranslation(locale, key)

  const adminLinks = [
    { href: '/admin/users', icon: Users, label: 'Manage Users', desc: 'Approve or reject access requests' },
    { href: '/admin/fixtures', icon: Calendar, label: 'Manage Fixtures', desc: 'Create matches and set kickoff times' },
    { href: '/admin/results', icon: Trophy, label: 'Finalize Results', desc: 'Enter scores and award points' },
    { href: '/admin/announcements', icon: AlertCircle, label: 'Announcements', desc: 'Publish rules and notices' },
  ]

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 -mt-4 z-10 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-sbk-navy mb-6 text-center">{t('adminDashboard')}</h2>
          
          <div className="grid gap-4">
            {adminLinks.map(link => (
              <Link key={link.href} href={link.href} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-sbk-blue flex items-center justify-center">
                  <link.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{link.label}</h3>
                  <p className="text-xs text-gray-500">{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
