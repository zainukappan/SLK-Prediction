'use client'

import { useState, useTransition } from 'react'
import { saveRulesAction, saveAnnouncementAction, deleteAnnouncementAction } from './actions'
import { BookOpen, Bell, Trash2, Edit3, CheckCircle2, Clock } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'

export function AnnouncementsAndRulesManager({
  rules,
  announcements,
}: {
  rules: any | null
  announcements: any[]
}) {
  const [activeTab, setActiveTab] = useState<'rules' | 'announcements'>('rules')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null)

  const handleSaveRules = (formData: FormData) => {
    startTransition(async () => {
      const res = await saveRulesAction(formData)
      if (res.error) setMessage(`Error: ${res.error}`)
      else {
        setMessage('Contest rules updated successfully! Member rules page updated.')
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  const handleSaveAnnouncement = (formData: FormData) => {
    startTransition(async () => {
      const res = await saveAnnouncementAction(formData)
      if (res.error) setMessage(`Error: ${res.error}`)
      else {
        setMessage('Announcement saved!')
        setEditingAnnouncement(null)
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  const handleDeleteAnnouncement = (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    startTransition(async () => {
      const res = await deleteAnnouncementAction(id)
      if (res.error) setMessage(`Error: ${res.error}`)
      else setMessage('Announcement removed.')
    })
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'rules' ? 'bg-white text-sbk-navy shadow-sm' : 'text-gray-600'
          }`}
        >
          Contest Rules
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'announcements' ? 'bg-white text-sbk-navy shadow-sm' : 'text-gray-600'
          }`}
        >
          Announcements ({announcements.length})
        </button>
      </div>

      {/* Tab 1: Rules Editor */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-sbk-navy flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sbk-blue" />
              Edit Bilingual Rules
            </h3>
            {rules?.updated_at && (
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated: {formatInTimeZone(new Date(rules.updated_at), 'Asia/Kolkata', "MMM d, yyyy h:mm a")} IST
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Edit the official rules shown to all members. Ensure scoring breakdown, deadlines, and the exact-outcome definition are documented.
          </p>

          <form action={handleSaveRules} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Title (English)</label>
                <input
                  type="text"
                  name="title_en"
                  required
                  defaultValue={rules?.title_en || 'Contest Rules'}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Title (Malayalam)</label>
                <input
                  type="text"
                  name="title_ml"
                  required
                  defaultValue={rules?.title_ml || 'മത്സര നിയമങ്ങൾ'}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Rules Content (English)</label>
              <textarea
                name="content_en"
                rows={10}
                required
                defaultValue={rules?.content_en || ''}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Rules Content (Malayalam)</label>
              <textarea
                name="content_ml"
                rows={10}
                required
                defaultValue={rules?.content_ml || ''}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900 font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-sbk-navy hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs shadow-sm disabled:opacity-50"
            >
              {isPending ? 'Saving Rules...' : 'Save Official Rules'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-sbk-navy mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-sbk-blue" />
                {editingAnnouncement ? 'Edit Announcement' : 'Publish New Announcement'}
              </span>
              {editingAnnouncement && (
                <button
                  type="button"
                  onClick={() => setEditingAnnouncement(null)}
                  className="text-xs text-gray-500 underline font-normal"
                >
                  Cancel
                </button>
              )}
            </h3>

            <form action={handleSaveAnnouncement} className="space-y-3">
              {editingAnnouncement && <input type="hidden" name="id" value={editingAnnouncement.id} />}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Title (EN) *</label>
                  <input
                    type="text"
                    name="title_en"
                    required
                    defaultValue={editingAnnouncement?.title_en || ''}
                    placeholder="e.g. Round 2 Predictions Open!"
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Title (ML)</label>
                  <input
                    type="text"
                    name="title_ml"
                    defaultValue={editingAnnouncement?.title_ml || ''}
                    placeholder="e.g. റൗണ്ട് 2 പ്രവചനങ്ങൾ ആരംഭിച്ചു!"
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Message (EN) *</label>
                <textarea
                  name="content_en"
                  rows={3}
                  required
                  defaultValue={editingAnnouncement?.content_en || ''}
                  placeholder="Enter notice content in English..."
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Message (ML)</label>
                <textarea
                  name="content_ml"
                  rows={3}
                  defaultValue={editingAnnouncement?.content_ml || ''}
                  placeholder="Enter notice content in Malayalam..."
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  name="active"
                  defaultChecked={editingAnnouncement ? editingAnnouncement.active : true}
                  className="w-4 h-4 rounded text-sbk-blue"
                />
                <label htmlFor="activeCheck" className="text-xs font-bold text-gray-700">
                  Active (Display on Home Screen)
                </label>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-sbk-navy hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm disabled:opacity-50"
              >
                {editingAnnouncement ? 'Update Announcement' : 'Publish Announcement'}
              </button>
            </form>
          </div>

          {/* Announcements List */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-sbk-navy mb-3">Existing Announcements</h3>
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">{a.title_en}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                          a.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {a.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {a.title_ml && (
                        <p className="text-[11px] text-gray-600">{a.title_ml}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingAnnouncement(a)}
                        className="p-1.5 text-sbk-blue hover:bg-blue-50 rounded-lg text-xs"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(a.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 whitespace-pre-line bg-white p-2 rounded-lg border border-gray-100">
                    {a.content_en}
                  </p>
                  {a.content_ml && (
                    <p className="text-xs text-gray-600 whitespace-pre-line bg-white p-2 rounded-lg border border-gray-100">
                      {a.content_ml}
                    </p>
                  )}
                </div>
              ))}

              {announcements.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-6">No announcements published yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
