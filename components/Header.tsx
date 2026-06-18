"use client"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"

export default function Header() {
  const [nickname, setNickname] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setNickname(session.user.user_metadata?.nickname || "")
      }
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setNickname(session.user.user_metadata?.nickname || null)
        // TODO: fetch avatar URL from profile table
      } else {
        setNickname(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-sm 
              group-hover:scale-110 transition-transform shadow-md group-hover:shadow-lg">
              K
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              크리에이타이
            </span>
          </Link>
          
          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: "홈", path: "/" },
              { label: "이미지", path: "/images" },
              { label: "에이전트", path: "/agents" },
            ].map(item => (
              <Link key={item.label} href={item.path as string}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
          
          {/* Auth area */}
          <div className="flex items-center gap-3">
            {nickname ? (
              <>
                <span className="text-sm font-medium text-slate-600">{nickname}님</span>
                <Link href="/profile" 
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                  {nickname?.[0] || "?"}
                </Link>
                <button onClick={handleLogout} 
                  className="text-sm text-slate-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">
                  로그아웃
                </button>
              </>
            ) : (
              <Link href="/login"
                className="bg-purple-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg">
                시작하기 🚀
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
