import { Header } from '@/components/layout/Header'
import { getUserProfile } from '@/lib/auth'
import { getTranslation, Locale } from '@/lib/i18n'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function RulesPage() {
  const profile = await getUserProfile()
  const locale = (profile?.language as Locale) || 'en'
  const t = (key: any) => getTranslation(locale, key)

  const content = {
    en: {
      title: "Contest Rules",
      sections: [
        {
          title: "1. Predictions & Deadlines",
          text: "You can submit or edit your prediction until exactly 5 minutes before the scheduled kickoff time. Once the deadline passes, predictions are locked. The countdown shown is informational; the server time dictates the strict deadline."
        },
        {
          title: "2. Scoring System",
          text: "Scores are based on the full-time result at the end of regulation time (including stoppage time). Extra time and penalty shootouts are EXCLUDED.\n\n• Exact Score: 5 Points\n• Correct Outcome (Win/Draw/Loss): 3 Points\n• Incorrect: 0 Points\n\nPoints are mutually exclusive (you get either 5 or 3, not both)."
        },
        {
          title: "3. Examples",
          text: "If the match ends 2-1:\n• You predicted 2-1: 5 Points (Exact)\n• You predicted 1-0: 3 Points (Correct Outcome, Home Win)\n• You predicted 1-1 or 0-1: 0 Points"
        },
        {
          title: "4. Postponements & Cancellations",
          text: "If a match is postponed or cancelled, it awards 0 points unless otherwise decided and announced by the organizers. If the kickoff time is changed, the deadline will be adjusted accordingly."
        },
        {
          title: "5. Leaderboard Tie-Breakers",
          text: "If users have the same total points, the tie is broken by:\n1. Highest number of Exact Scores (5 pts)\n2. Highest number of Correct Outcomes (3 pts)\nIf still tied, a shared rank is given."
        }
      ]
    },
    ml: {
      title: "മത്സര നിയമങ്ങൾ",
      sections: [
        {
          title: "1. പ്രവചനങ്ങളും സമയപരിധിയും",
          text: "ഷെഡ്യൂൾ ചെയ്ത കിക്കോഫ് സമയത്തിന് കൃത്യം 5 മിനിറ്റ് മുമ്പ് വരെ നിങ്ങൾക്ക് പ്രവചനം സമർപ്പിക്കാനോ എഡിറ്റ് ചെയ്യാനോ കഴിയും. അതിനുശേഷം പ്രവചനങ്ങൾ ലോക്ക് ചെയ്യപ്പെടും."
        },
        {
          title: "2. സ്കോറിംഗ് സിസ്റ്റം",
          text: "റെഗുലേഷൻ സമയം (സ്റ്റോപ്പേജ് സമയം ഉൾപ്പെടെ) അവസാനിക്കുമ്പോഴുള്ള ഫുൾ ടൈം റിസൾട്ട് അടിസ്ഥാനമാക്കിയാണ് സ്കോറുകൾ. എക്സ്ട്രാ ടൈം, പെനാൽറ്റി ഷൂട്ടൗട്ടുകൾ എന്നിവ ഒഴിവാക്കിയിരിക്കുന്നു.\n\n• കൃത്യമായ സ്കോർ: 5 പോയിന്റ്\n• ശരിയായ ഫലം (ജയം/സമനില/തോൽവി): 3 പോയിന്റ്\n• തെറ്റായത്: 0 പോയിന്റ്"
        },
        {
          title: "3. ഉദാഹരണങ്ങൾ",
          text: "മത്സരം 2-1 ന് അവസാനിച്ചാൽ:\n• പ്രവചനം 2-1: 5 പോയിന്റ് (കൃത്യം)\n• പ്രവചനം 1-0: 3 പോയിന്റ് (ശരിയായ ഫലം)\n• പ്രവചനം 1-1 അല്ലെങ്കിൽ 0-1: 0 പോയിന്റ്"
        },
        {
          title: "4. മാറ്റിവെക്കലുകളും റദ്ദാക്കലുകളും",
          text: "ഒരു മത്സരം മാറ്റിവെക്കുകയോ റദ്ദാക്കുകയോ ചെയ്താൽ, അതിന് പോയിന്റ് ലഭിക്കില്ല (മാനേജ്മെന്റ് തീരുമാനപ്രകാരം മാറ്റം വരാം)."
        },
        {
          title: "5. ലീഡർബോർഡ് ടൈ-ബ്രേക്കർ",
          text: "തുല്യ പോയിന്റ് വന്നാൽ:\n1. കൂടുതൽ കൃത്യമായ സ്കോറുകൾ (5 പോയിന്റ്)\n2. കൂടുതൽ ശരിയായ ഫലങ്ങൾ (3 പോയിന്റ്)\nഇനിയും തുല്യമാണെങ്കിൽ ഒരേ റാങ്ക് പങ്കിടും."
        }
      ]
    }
  }

  const rules = content[locale]

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <Header locale={locale} />
      
      <div className="p-4 -mt-4 z-10 space-y-4">
        <Link href="/profile" className="flex items-center gap-2 text-sbk-blue font-bold text-sm mb-2 px-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-sbk-navy mb-6 text-center">{rules.title}</h2>
          
          <div className="space-y-6">
            {rules.sections.map((sec, idx) => (
              <div key={idx}>
                <h3 className="font-bold text-gray-800 mb-2">{sec.title}</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{sec.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="font-bold text-gray-800 mb-2">Contact Organizers</h3>
            <p className="text-sm text-gray-600">For issues or inquiries, please contact the admin team in the SBK WhatsApp Group.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
