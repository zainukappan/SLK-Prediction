import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { getTranslation } from '@/lib/i18n'
import { GoogleLoginButton } from './GoogleLoginButton'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/home')
  }

  // Define a simple server action for Google login.
  // Note: For OAuth in Server Actions in Next.js, we must return the URL and redirect on the client,
  // or use redirect() if we are careful with the request context.
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-sbk-navy p-6">
      <div className="flex flex-col items-center mb-12">
        <Image 
          src="/sbk-logo.svg" 
          alt="SBK Logo" 
          width={150} 
          height={150} 
          className="mb-6 rounded-full border-4 border-sbk-yellow"
        />
        <h1 className="text-3xl font-bold text-white mb-2 text-center">SLK PREDICTION CONTEST</h1>
        <p className="text-gray-300 text-sm tracking-widest text-center">FANS PREDICT. FOOTBALL UNITES.</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-6">Welcome</h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          This is a private contest for SBK members. Please sign in to request access.
        </p>
        
        <GoogleLoginButton />
      </div>
    </div>
  )
}
