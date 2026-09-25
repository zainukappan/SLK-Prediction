import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { UserReviewList, ProfileItem } from './UserReviewList'
import { Locale } from '@/lib/i18n'

export default async function AdminUsersPage() {
  const profile = await getUserProfile()
  if (profile?.role !== 'admin') redirect('/home')

  const locale = (profile?.language as Locale) || 'en'
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 -mt-4 z-10 space-y-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sbk-blue font-bold text-xs px-2 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Admin Overview
        </Link>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-sbk-navy flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Membership Review Queue
            </h2>
            <span className="text-xs text-gray-500 font-medium">
              {users?.length || 0} Total
            </span>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Review membership access requests. You may attach private admin notes to explain approval, rejection, or suspension. These notes are strictly private to admins.
          </p>

          <UserReviewList users={(users as ProfileItem[]) || []} />
        </div>
      </div>
    </div>
  )
}
