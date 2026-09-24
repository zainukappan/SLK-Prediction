import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function AdminUsersPage() {
  const profile = await getUserProfile()
  if (profile?.role !== 'admin') redirect('/home')

  const supabase = await createClient()
  const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

  async function updateUserStatus(userId: string, status: string) {
    'use server'
    const adminSupabase = await createClient()
    await adminSupabase.from('profiles').update({ status }).eq('id', userId)
    revalidatePath('/admin/users')
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale="en" />
      <div className="p-4 -mt-4 z-10 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-sbk-navy mb-6">Manage Users</h2>
          
          <div className="space-y-4">
            {users?.map(user => (
              <div key={user.id} className="flex flex-col gap-2 p-3 border border-gray-100 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">{user.display_name}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${
                    user.status === 'approved' ? 'bg-green-100 text-green-700' :
                    user.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{user.status}</span>
                </div>
                
                <div className="flex gap-2 mt-2">
                  {user.status !== 'approved' && (
                    <form action={updateUserStatus.bind(null, user.id, 'approved')} className="flex-1">
                      <button type="submit" className="w-full bg-green-500 text-white text-xs font-bold py-2 rounded shadow-sm">Approve</button>
                    </form>
                  )}
                  {user.status !== 'rejected' && user.status !== 'suspended' && (
                    <form action={updateUserStatus.bind(null, user.id, 'rejected')} className="flex-1">
                      <button type="submit" className="w-full bg-red-500 text-white text-xs font-bold py-2 rounded shadow-sm">Reject</button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
