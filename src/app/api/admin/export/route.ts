import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateLeaderboard } from '@/lib/scoring'
import { formatInTimeZone } from 'date-fns-tz'

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized: Please sign in', { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return new NextResponse('Forbidden: Admin access required', { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const exportType = searchParams.get('type') || 'fixtures'

  let csvContent = ''
  let filename = `sbk-${exportType}-${Date.now()}.csv`

  if (exportType === 'fixtures') {
    const { data: fixtures } = await supabase
      .from('fixtures')
      .select('*, round:rounds(name), home_team:teams!home_team_id(name, short_name), away_team:teams!away_team_id(name, short_name)')
      .order('kickoff_time', { ascending: true })

    const headers = [
      'Fixture ID',
      'Round',
      'Home Team',
      'Home Short',
      'Away Team',
      'Away Short',
      'Kickoff Time (IST)',
      'Status',
      'Home Score',
      'Away Score',
      'Finalized',
      'Rescheduled',
    ]

    const rows = (fixtures || []).map((f) => [
      f.id,
      f.round?.name || 'Round',
      f.home_team?.name || 'TBD',
      f.home_team?.short_name || 'TBD',
      f.away_team?.name || 'TBD',
      f.away_team?.short_name || 'TBD',
      f.kickoff_time ? formatInTimeZone(new Date(f.kickoff_time), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm') + ' IST' : '',
      f.status,
      f.home_score ?? '',
      f.away_score ?? '',
      f.finalized ? 'Yes' : 'No',
      f.is_rescheduled ? 'Yes' : 'No',
    ])

    csvContent = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((row) => row.map(escapeCsvCell).join(',')),
    ].join('\r\n')
  } else if (exportType === 'standings') {
    const { data: profiles } = await supabase.from('profiles').select('id, display_name, status')
    const { data: predictions } = await supabase.from('predictions').select('*')
    const { data: fixtures } = await supabase.from('fixtures').select('*')

    const { leaderboard } = calculateLeaderboard(
      profiles || [],
      predictions || [],
      fixtures || []
    )

    const headers = ['Rank', 'Shared Rank', 'Member Name', 'Total Points', 'Exact Scores', 'Correct Outcomes']
    const rows = leaderboard.map((item) => [
      item.rank,
      item.sharedRankDisplay,
      item.name,
      item.points,
      item.exact,
      item.outcome,
    ])

    csvContent = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((row) => row.map(escapeCsvCell).join(',')),
    ].join('\r\n')
  } else if (exportType === 'predictions') {
    const { data: predictions } = await supabase
      .from('predictions')
      .select('*, profile:profiles(display_name), fixture:fixtures(kickoff_time, home_team:teams!home_team_id(short_name), away_team:teams!away_team_id(short_name))')
      .order('created_at', { ascending: false })

    const headers = [
      'Prediction ID',
      'Member Name',
      'Match',
      'Kickoff (IST)',
      'Predicted Home',
      'Predicted Away',
      'Points Awarded',
      'Points Reason',
      'Submitted At (IST)',
    ]

    const rows = (predictions || []).map((p: any) => [
      p.id,
      p.profile?.display_name || 'Member',
      `${p.fixture?.home_team?.short_name || 'Home'} vs ${p.fixture?.away_team?.short_name || 'Away'}`,
      p.fixture?.kickoff_time ? formatInTimeZone(new Date(p.fixture.kickoff_time), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm') + ' IST' : '',
      p.home_score,
      p.away_score,
      p.points_awarded ?? '',
      p.points_reason || '',
      p.created_at ? formatInTimeZone(new Date(p.created_at), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm') + ' IST' : '',
    ])

    csvContent = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((row) => row.map(escapeCsvCell).join(',')),
    ].join('\r\n')
  } else {
    return new NextResponse('Invalid export type', { status: 400 })
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
