'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function EmailLoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    const supabase = createClient()

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
        setIsLoading(false)
      } else {
        router.push('/home')
        router.refresh()
      }
    } else {
      if (!name) {
        setError('Display name is required')
        setIsLoading(false)
        return
      }
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name
          }
        }
      })
      
      if (error) {
        setError(error.message)
        setIsLoading(false)
      } else {
        // Automatically sign them in after signup since email confirmation might be off
        await supabase.auth.signInWithPassword({ email, password })
        router.push('/home')
        router.refresh()
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!isLogin && (
        <input 
          type="text" 
          placeholder="Display Name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-xl"
          required={!isLogin}
        />
      )}
      <input 
        type="email" 
        placeholder="Email Address" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 border border-gray-200 rounded-xl"
        required
      />
      <input 
        type="password" 
        placeholder="Password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 border border-gray-200 rounded-xl"
        required
        minLength={6}
      />

      {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

      <button 
        type="submit"
        disabled={isLoading}
        className="w-full bg-sbk-blue text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50"
      >
        {isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
      </button>

      <button 
        type="button"
        onClick={() => { setIsLogin(!isLogin); setError(''); }}
        className="text-sm text-gray-500 mt-2 underline"
      >
        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
      </button>
    </form>
  )
}
