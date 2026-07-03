"use client"
import Header from "@/components/Header"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [id, setId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Already logged in → redirect home
  useEffect(() => {
    try {
      const session = localStorage.getItem("subaski_session")
      if (session) {
        router.push("/")
      }
    } catch {}
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Local auth: aski / 1234
      if (id === "aski" && password === "1234") {
        let userId = "local-aski"
        // Ensure a real Supabase UUID exists for this account
        try {
          const { data: sessionData } = await supabase.auth.signInWithPassword({
            email: "aski@subaski.local",
            password: "1234",
          })
          if (sessionData?.user?.id) {
            userId = sessionData.user.id
          }
        } catch {}

        if (userId === "local-aski") {
          try {
            const { data: signupData } = await supabase.auth.signUp({
              email: "aski@subaski.local",
              password: "1234",
              options: { data: { nickname: "aski" } },
            })
            if (signupData?.user?.id) userId = signupData.user.id
          } catch {}
        }

        localStorage.setItem(
          "subaski_session",
          JSON.stringify({
            id: userId,
            nickname: "aski",
            loginAt: new Date().toISOString(),
          })
        )

        router.push("/")
        return
      }

      // Try Supabase email auth as fallback
      const { error: supaError } = await supabase.auth.signInWithPassword({
        email: id,
        password,
      })

      if (!supaError) {
        localStorage.setItem("subaski_session", JSON.stringify({
          id: "supabase_user",
          nickname: id,
          loginAt: new Date().toISOString(),
        }))
        router.push("/")
        return
      }

      setError("아이디 또는 비밀번호가 올바르지 않습니다")
    } catch {
      setError("로그인 중 오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleLogin(e)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ minHeight: "calc(100vh - 4rem)" }}>
        <div className="w-full max-w-md">
          {/* Logo + greeting */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl text-white text-3xl font-bold mb-6 shadow-xl">
              K
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
              다시 오신 것을 환영해요! 👋
            </h1>
            <p className="text-slate-500">아이디와 비밀번호로 로그인하세요</p>
          </div>

          {/* Login form */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* ID */}
              <div>
                <label htmlFor="id" className="block text-sm font-medium text-slate-700 mb-2">
                  아이디
                </label>
                <input
                  id="id"
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="aski"
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-lg"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-lg"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 text-center">
                  ❌ {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !id || !password}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-md ${
                  loading || !id || !password
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-xl hover:scale-[1.02]"
                }`}
              >
                {loading ? "⏳ 로그인 중..." : "🚀 로그인"}
              </button>
            </form>

            {/* Helper info */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400 text-center">
                기본 아이디: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">aski</code>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
