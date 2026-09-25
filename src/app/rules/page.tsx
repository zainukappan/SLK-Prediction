import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { getTranslation, Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'

export default async function RulesPage() {
  const profile = await getUserProfile()
  const locale = (profile?.language as Locale) || 'en'
  const t = (key: any) => getTranslation(locale, key)

  const supabase = await createClient()
  const { data: rulesData } = await supabase.from('rules').select('*').limit(1)
  const dbRules = rulesData && rulesData.length > 0 ? rulesData[0] : null

  const defaultContent = {
    en: {
      title: "Contest Rules",
      content: `1. Predictions & Deadlines
You can submit or edit your prediction until exactly 5 minutes before the scheduled kickoff time. Once the deadline passes, predictions are locked. The countdown is informational; the authoritative server time dictates the strict deadline.

2. Scoring System
Scores are based on the full-time result at the end of regulation time (including stoppage time). Extra time and penalty shootouts are EXCLUDED.
• Exact Score: 5 Points
• Correct Outcome (Win/Draw/Loss): 3 Points
• Incorrect: 0 Points
Points are mutually exclusive (you get either 5 or 3, not both).

3. Correct Outcomes Statistic
An exact-score prediction also counts toward the member's "Correct Outcomes" statistic. A non-exact prediction with the right win/draw outcome also counts.

4. Postponements, Cancellations & Rescheduling
• Postponed fixtures receive no points while awaiting a valid final result.
• Cancelled fixtures receive 0 points.
• If kickoff time changes, the prediction deadline is recalculated from the new kickoff time (5 minutes before new kickoff). If the new deadline is in the future, members may edit their prediction.

5. Leaderboard Tie-Breakers
If members have the same total points, the tie is broken by:
1. Highest number of Exact Scores (5 pts)
2. Highest number of Correct Outcomes (Exact + Outcome)
If members remain tied after all 3 tie-breakers, a shared rank is displayed.`
    },
    ml: {
      title: "മത്സര നിയമങ്ങൾ",
      content: `1. പ്രവചനങ്ങളും സമയപരിധിയും
ഷെഡ്യൂൾ ചെയ്ത കിക്കോഫ് സമയത്തിന് കൃത്യം 5 മിനിറ്റ് മുമ്പ് വരെ നിങ്ങൾക്ക് പ്രവചനം സമർപ്പിക്കാനോ എഡിറ്റ് ചെയ്യാനോ കഴിയും. അതിനുശേഷം പ്രവചനങ്ങൾ ലോക്ക് ചെയ്യപ്പെടും. സെർവർ സമയമാണ് കർശനമായ സമയപരിധി നിശ്ചയിക്കുന്നത്.

2. സ്കോറിംഗ് സിസ്റ്റം
റെഗുലേഷൻ സമയം (സ്റ്റോപ്പേജ് സമയം ഉൾപ്പെടെ) അവസാനിക്കുമ്പോഴുള്ള ഫുൾ ടൈം റിസൾട്ട് അടിസ്ഥാനമാക്കിയാണ് സ്കോറുകൾ. എക്സ്ട്രാ ടൈം, പെനാൽറ്റി ഷൂട്ടൗട്ടുകൾ എന്നിവ ഒഴിവാക്കിയിരിക്കുന്നു.
• കൃത്യമായ സ്കോർ: 5 പോയിന്റ്
• ശരിയായ ഫലം (ജയം/സമനില/തോൽവി): 3 പോയിന്റ്
• തെറ്റായത്: 0 പോയിന്റ്
പോയിന്റുകൾ ഒന്നിച്ചു ലഭിക്കില്ല (5 അല്ലെങ്കിൽ 3 പോയിന്റ് മാത്രം).

3. ശരിയായ ഫലങ്ങളുടെ കണക്ക്
കൃത്യമായ സ്കോർ പ്രവചിച്ചാൽ അത് അംഗത്തിന്റെ "ശരിയായ ഫലങ്ങൾ" കണക്കിലും ഉൾപ്പെടും. ഫലം മാത്രം ശരിയായതും ഇതിൽ കണക്കാക്കും.

4. മാറ്റിവെക്കലുകളും റദ്ദാക്കലുകളും സമയമാറ്റവും
• മാറ്റിവെച്ച മത്സരങ്ങൾക്ക് അന്തിമഫലം വരുന്നതുവരെ പോയിന്റ് ലഭിക്കില്ല.
• റദ്ദാക്കിയ മത്സരങ്ങൾക്ക് 0 പോയിന്റാണ്.
• കിക്കോഫ് സമയം മാറ്റിയാൽ, പ്രവചന സമയപരിധി പുതിയ കിക്കോഫ് സമയത്തിന് 5 മിനിറ്റ് മുമ്പ് വരെയായി പുതുക്കി നിശ്ചയിക്കും. പുതിയ സമയപരിധി ഭാവിയിലാണെങ്കിൽ അംഗങ്ങൾക്ക് പ്രവചനം തിരുത്താം.

5. ലീഡർബോർഡ് ടൈ-ബ്രേക്കർ
തുല്യ പോയിന്റ് വന്നാൽ:
1. കൂടുതൽ കൃത്യമായ സ്കോറുകൾ (5 പോയിന്റ്)
2. കൂടുതൽ ശരിയായ ഫലങ്ങൾ (കൃത്യമായതും ശരിയായ ഫലങ്ങളും)
ഇതിലും തുല്യമാണെങ്കിൽ ഒരേ റാങ്ക് പങ്കിടും.`
    }
  }

  const title = locale === 'ml' 
    ? (dbRules?.title_ml || defaultContent.ml.title)
    : (dbRules?.title_en || defaultContent.en.title)

  const contentText = locale === 'ml'
    ? (dbRules?.content_ml || defaultContent.ml.content)
    : (dbRules?.content_en || defaultContent.en.content)

  const lastUpdated = dbRules?.updated_at 
    ? formatInTimeZone(new Date(dbRules.updated_at), 'Asia/Kolkata', "MMM d, yyyy h:mm a") + ' IST'
    : 'Sep 25, 2026'

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 -mt-4 z-10 space-y-4">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sbk-blue font-bold text-xs px-2 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col items-center text-center pb-2 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-sbk-blue flex items-center justify-center mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-sbk-navy">{title}</h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>{t('rulesLastUpdated')}: {lastUpdated}</span>
            </div>
          </div>

          <div className="text-xs text-gray-700 whitespace-pre-line leading-relaxed font-sans pt-2">
            {contentText}
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100">
            <h3 className="font-bold text-gray-800 text-xs mb-1">
              {locale === 'ml' ? 'സഹായത്തിന്' : 'Contact SBK Admins'}
            </h3>
            <p className="text-xs text-gray-500">
              {locale === 'ml'
                ? 'സംശയങ്ങൾക്കോ പ്രശ്നങ്ങൾക്കോ SBK WhatsApp ഗ്രൂപ്പിലെ അഡ്മിൻമാരുമായി ബന്ധപ്പെടുക.'
                : 'For issues, inquiries or dispute resolution, contact the admin team in the SBK WhatsApp Group.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
