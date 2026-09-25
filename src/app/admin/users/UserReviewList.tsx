'use client'

import { useState, useTransition } from 'react'
import { updateUserStatus } from './actions'
import { Check, X, Ban, ShieldAlert, MessageSquare, Search } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'

export interface ProfileItem {
  id: string
  display_name: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  role: 'member' | 'admin'
  language: string
  admin_notes?: string | null
  created_at: string
}

export function UserReviewList({ users }: { users: ProfileItem[] }) {
  const [filter, setFilter] = useState<string>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [notesState, setNotesState] = useState<Record<string, string>>({})
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const filteredUsers = users.filter((u) => {
    const matchesFilter = filter === 'all' ? true : u.status === filter
    const matchesSearch = u.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleStatusChange = (userId: string, status: string) => {
    const note = notesState[userId] || ''
    startTransition(async () => {
      const formData = new FormData()
      formData.set('userId', userId)
      formData.set('status', status)
      formData.set('adminNote', note)

      const res = await updateUserStatus(formData)
      if (res.error) {
        setActionMessage(`Error: ${res.error}`)
      } else {
        setActionMessage(`User updated to ${status}. Note recorded privately.`)
        setTimeout(() => setActionMessage(null), 3000)
      }
    })
  }

  const counts = {
    all: users.length,
    pending: users.filter((u) => u.status === 'pending').length,
    approved: users.filter((u) => u.status === 'approved').length,
    rejected: users.filter((u) => u.status === 'rejected').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
  }

  return (
    <div className="space-y-4">
      {actionMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
          {actionMessage}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search members by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-sbk-yellow"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {(['pending', 'approved', 'rejected', 'suspended', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === tab
                ? 'bg-sbk-navy text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
          </button>
        ))}
      </div>

      {/* User Cards List */}
      <div className="space-y-3">
        {filteredUsers.map((user) => {
          const isNoteOpen = expandedNotes[user.id] || !!notesState[user.id]

          return (
            <div
              key={user.id}
              className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{user.display_name}</span>
                    {user.role === 'admin' && (
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Joined: {formatInTimeZone(new Date(user.created_at), 'Asia/Kolkata', 'MMM d, yyyy h:mm a')} IST
                  </p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    user.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : user.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : user.status === 'suspended'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {user.status}
                </span>
              </div>

              {/* Existing Private Note (Admin-Only View) */}
              {user.admin_notes && (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 uppercase tracking-wide mb-1">
                    <ShieldAlert className="w-3 h-3" />
                    Private Admin Note (Hidden from Member)
                  </div>
                  <p className="text-gray-800 text-xs italic">{user.admin_notes}</p>
                </div>
              )}

              {/* Note Input Toggle / Form */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedNotes((prev) => ({ ...prev, [user.id]: !prev[user.id] }))
                  }
                  className="text-xs font-semibold text-sbk-blue flex items-center gap-1 hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {isNoteOpen ? 'Hide note field' : 'Add/edit private note'}
                </button>

                {isNoteOpen && (
                  <div className="space-y-1">
                    <textarea
                      rows={2}
                      placeholder="Optional private note (e.g. SBK WhatsApp verified, phone +91 98..., reason for suspension)..."
                      defaultValue={notesState[user.id] ?? user.admin_notes ?? ''}
                      onChange={(e) =>
                        setNotesState((prev) => ({ ...prev, [user.id]: e.target.value }))
                      }
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sbk-blue"
                    />
                    <p className="text-[10px] text-gray-400 italic">
                      Private to admins. Never displayed to members.
                    </p>
                  </div>
                )}
              </div>

              {/* Review Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                {user.status !== 'approved' && (
                  <button
                    onClick={() => handleStatusChange(user.id, 'approved')}
                    disabled={isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg shadow-sm flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                )}

                {user.status !== 'rejected' && user.status !== 'suspended' && (
                  <button
                    onClick={() => handleStatusChange(user.id, 'rejected')}
                    disabled={isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg shadow-sm flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                )}

                {user.status === 'approved' && (
                  <button
                    onClick={() => handleStatusChange(user.id, 'suspended')}
                    disabled={isPending}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-lg shadow-sm flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" /> Suspend
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-100 text-gray-500 text-xs">
            No members found in this status category.
          </div>
        )}
      </div>
    </div>
  )
}
