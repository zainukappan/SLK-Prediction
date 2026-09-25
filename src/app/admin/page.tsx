import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { getTranslation, Locale, getTeamShortName } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { getRecentAdminAuditLogs } from '@/lib/admin-audit'
import Link from 'next/link'
import { 
  Users, 
  Calendar, 
  Trophy, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  FileSpreadsheet, 
  ShieldAlert, 
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { formatInTimeZone } from 'date-fns-tz'

export default async function AdminPage() {
  const profile = await getUserProfile()
  
  if (profile?.role !== 'admin') {
    redirect('/home')
  }

  const locale = (profile?.language as Locale) || 'en'
  const t = (key: any) => getTranslation(locale, key)
  const supabase = await createClient()

  // 1. Pending membership requests
  const { data: pendingUsers } = await supabase
    .from('profiles')
    .select('id, display_name, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5)

  const { count: pendingCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  // 2. Upcoming matches
  const { data: upcomingFixtures } = await supabase
    .from('fixtures')
    .select('id, kickoff_time, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), status, is_rescheduled')
    .eq('status', 'upcoming')
    .gt('kickoff_time', new Date().toISOString())
    .order('kickoff_time', { ascending: true })
    .limit(4)

  const { count: upcomingCount } = await supabase
    .from('fixtures')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'upcoming')
    .gt('kickoff_time', new Date().toISOString())

  // 3. Fixtures awaiting results (kickoff has passed, but not finalized)
  const { data: awaitingFixtures } = await supabase
    .from('fixtures')
    .select('id, kickoff_time, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), status, finalized')
    .eq('finalized', false)
    .neq('status', 'cancelled')
    .lte('kickoff_time', new Date().toISOString())
    .order('kickoff_time', { ascending: false })
    .limit(4)

  const { count: awaitingCount } = await supabase
    .from('fixtures')
    .select('id', { count: 'exact', head: true })
    .eq('finalized', false)
    .neq('status', 'cancelled')
    .lte('kickoff_time', new Date().toISOString())

  // 4. Recent admin actions
  const recentLogs = await getRecentAdminAuditLogs(6)

  const adminLinks = [
    { href: '/admin/users', icon: Users, label: t('manageUsers'), count: pendingCount || 0, badgeColor: 'bg-amber-100 text-amber-800' },
    { href: '/admin/fixtures', icon: Calendar, label: t('manageFixtures'), count: upcomingCount || 0, badgeColor: 'bg-blue-100 text-sbk-blue' },
    { href: '/admin/results', icon: Trophy, label: t('finalizeResults'), count: awaitingCount || 0, badgeColor: 'bg-red-100 text-red-700' },
    { href: '/admin/announcements', icon: AlertCircle, label: t('announcements'), count: null },
  ]

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 -mt-4 z-10 space-y-5">
        
        {/* Welcome & Quick Stats */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-sbk-navy flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sbk-yellow" />
                {t('adminDashboard')}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">{t('adminOverview')}</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sbk-navy text-white uppercase tracking-wider">
              Admin
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <Link href="/admin/users" className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 text-center transition-transform hover:scale-[1.02]">
              <span className="text-2xl font-black text-amber-700">{pendingCount ?? 0}</span>
              <p className="text-[10px] font-bold text-amber-800 uppercase mt-0.5 leading-tight">{t('pendingRequests')}</p>
            </Link>
            <Link href="/admin/fixtures" className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-3 text-center transition-transform hover:scale-[1.02]">
              <span className="text-2xl font-black text-sbk-blue">{upcomingCount ?? 0}</span>
              <p className="text-[10px] font-bold text-blue-900 uppercase mt-0.5 leading-tight">{t('upcomingFixtures')}</p>
            </Link>
            <Link href="/admin/results" className="bg-red-50/70 border border-red-200/60 rounded-xl p-3 text-center transition-transform hover:scale-[1.02]">
              <span className="text-2xl font-black text-red-600">{awaitingCount ?? 0}</span>
              <p className="text-[10px] font-bold text-red-900 uppercase mt-0.5 leading-tight">{t('awaitingResults')}</p>
            </Link>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-2 gap-3">
          {adminLinks.map(link => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-sbk-blue/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-sbk-blue flex items-center justify-center">
                  <link.icon className="w-5 h-5" />
                </div>
                {link.count !== null && link.count > 0 && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${link.badgeColor}`}>
                    {link.count}
                  </span>
                )}
              </div>
              <span className="font-bold text-sm text-gray-900">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Section 1: Pending Membership Queue */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              {t('pendingRequests')}
            </h3>
            <Link href="/admin/users" className="text-xs font-bold text-sbk-blue flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {pendingUsers && pendingUsers.length > 0 ? (
              pendingUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="font-bold text-xs text-gray-900">{user.display_name}</p>
                    <p className="text-[10px] text-gray-500">
                      Requested {formatInTimeZone(new Date(user.created_at), 'Asia/Kolkata', 'MMM d, h:mm a')} IST
                    </p>
                  </div>
                  <Link 
                    href="/admin/users" 
                    className="text-[11px] font-bold bg-sbk-blue text-white px-2.5 py-1 rounded-lg hover:bg-blue-900"
                  >
                    Review
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-3 text-center bg-gray-50 rounded-xl">
                No pending membership requests. All caught up!
              </p>
            )}
          </div>
        </div>

        {/* Section 2: Fixtures Awaiting Result */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-600" />
              {t('awaitingResults')}
            </h3>
            <Link href="/admin/results" className="text-xs font-bold text-sbk-blue flex items-center gap-1">
              Finalize <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {awaitingFixtures && awaitingFixtures.length > 0 ? (
              awaitingFixtures.map(fixture => (
                <div key={fixture.id} className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/50 border border-red-100">
                  <div>
                    <p className="font-bold text-xs text-gray-900">
                      {getTeamShortName(fixture.home_team, locale)} vs {getTeamShortName(fixture.away_team, locale)}
                    </p>
                    <p className="text-[10px] text-red-600 font-medium">
                      Kickoff: {formatInTimeZone(new Date(fixture.kickoff_time), 'Asia/Kolkata', 'MMM d, h:mm a')} IST
                    </p>
                  </div>
                  <Link 
                    href="/admin/results" 
                    className="text-[11px] font-bold bg-red-600 text-white px-2.5 py-1 rounded-lg hover:bg-red-700 shadow-sm"
                  >
                    Enter Score
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-3 text-center bg-gray-50 rounded-xl">
                No past fixtures waiting for scores.
              </p>
            )}
          </div>
        </div>

        {/* Section 3: Upcoming Matches */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sbk-blue" />
              {t('upcomingFixtures')}
            </h3>
            <Link href="/admin/fixtures" className="text-xs font-bold text-sbk-blue flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {upcomingFixtures && upcomingFixtures.length > 0 ? (
              upcomingFixtures.map(f => (
                <div key={f.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="font-bold text-xs text-gray-900">
                      {getTeamShortName(f.home_team, locale)} vs {getTeamShortName(f.away_team, locale)}
                      {f.is_rescheduled && (
                        <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          Rescheduled
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {formatInTimeZone(new Date(f.kickoff_time), 'Asia/Kolkata', 'MMM d, h:mm a')} IST
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    Open
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-3 text-center bg-gray-50 rounded-xl">
                No upcoming fixtures scheduled.
              </p>
            )}
          </div>
        </div>

        {/* Section 4: Recent Admin Actions (Audit Trail) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-gray-700" />
              {t('recentAdminActions')}
            </h3>
          </div>

          <div className="space-y-2">
            {recentLogs && recentLogs.length > 0 ? (
              recentLogs.map((log: any) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {log.created_at ? formatInTimeZone(new Date(log.created_at), 'Asia/Kolkata', 'MMM d, h:mm a') : ''}
                    </span>
                  </div>
                  {log.reason && (
                    <p className="text-[11px] text-gray-600 mt-1 italic">
                      "{log.reason}"
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    By: {log.admin?.display_name || 'Admin'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-3 text-center bg-gray-50 rounded-xl">
                {t('noActionsRecorded')}
              </p>
            )}
          </div>
        </div>

        {/* Section 5: Admin-Only CSV Exports */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Admin Data Exports (CSV)
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Export official contest records for audit and record-keeping. Restrict access to authorized admins only.
          </p>
          <div className="flex flex-col gap-2">
            <a 
              href="/api/admin/export?type=fixtures" 
              className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <span>{t('exportFixtures')}</span>
              <FileSpreadsheet className="w-4 h-4 text-gray-400" />
            </a>
            <a 
              href="/api/admin/export?type=standings" 
              className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <span>{t('exportStandings')}</span>
              <FileSpreadsheet className="w-4 h-4 text-gray-400" />
            </a>
            <a 
              href="/api/admin/export?type=predictions" 
              className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <span>{t('exportPredictions')}</span>
              <FileSpreadsheet className="w-4 h-4 text-gray-400" />
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
