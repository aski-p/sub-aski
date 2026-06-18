"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/Header"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Role } from "@/lib/types"

export default function RegisterAgentPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [roleId, setRoleId] = useState("")
  const [description, setDescription] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [ollamaTest, setOllamaTest] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetch("/api/roles").then(r => r.json()).then(setRoles).catch(console.error)
  }, [])

  // Ollama 연결 테스트
  const testOllama = async () => {
    if (!name) return
    setTesting(true)
    try {
      const res = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen3-coder:30b",
          messages: [
            { role: "system", content: `너는 "${name}"이라는 이름의 AI 에이전트다. 간단히 자기소개를 하세요.` },
            { role: "user", content: "안녕! 너 뭐해?" },
          ],
          stream: false,
        }),
      })
      const data = await res.json()
      setOllamaTest(data.message?.content || "연결 성공!")
    } catch (err: any) {
      setOllamaTest(`❌ 연결 실패: ${err.message}`)
    } finally {
      setTesting(false)
    }
  }

  // 에이전트 등록
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Get current user ID from Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert("로그인이 필요합니다")
        return router.push("/login")
      }

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role_id: roleId || null,
          description: description || null,
          avatar_url: avatarUrl || null,
          user_id: session.user.id,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "등록 실패")
      }

      const agent = await res.json()

      // Ollama 연결 테스트 후 성공 시 대시보드로 이동
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push(`/agents/chat/${agent.id}`)
    } catch (err: any) {
      alert(`에이전트 등록 실패: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link href="/agents" className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium mb-6">
          ← 에이전트 목록으로 돌아가기
        </Link>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">🤖 새 에이전트 등록</h1>
        <p className="text-slate-500 mb-8">에이전트 정보를 입력하고, Ollama 로컬 모델에 연결하세요.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">❶ 기본 정보</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">이름 *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                maxLength={50} placeholder="예: 네이버, 마루, 스타..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg" />
              <p className="text-xs text-slate-400 mt-1">이름으로 직접 명령할 수 있어요</p>
            </div>

            {/* Ollama test */}
            {name && (
              <div className="flex items-center gap-3">
                <button type="button" onClick={testOllama} disabled={testing}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    testing ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}>
                  {testing ? "⏳ 테스트 중..." : "🧪 Ollama 연결 테스트"}
                </button>
                {ollamaTest && (
                  <div className="flex-1 bg-green-50 rounded-lg p-3 text-sm text-green-800 border border-green-200">
                    ✅ {ollamaTest}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Role */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">❷ 역할 선택</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {roles.map((role: Role) => (
                <button type="button" key={role.id} onClick={() => setRoleId(role.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    roleId === role.id ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200" : "border-slate-100 hover:border-purple-200"
                  }`}>
                  <div className="text-xl mb-1">{role.icon}</div>
                  <div className="font-bold text-sm text-slate-900">{role.name}</div>
                  {role.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{role.description}</p>}
                </button>
              ))}
            </div>

            {!roleId && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">⚠️ 역할을 선택하지 않아도 되지만 추천드려요</p>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">❸ 상세 설명</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">설명 (선택)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                maxLength={1000} placeholder="이 에이전트의 역할과 특성을 자세히 적어주세요..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
            </div>
          </div>

          {/* Avatar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">❹ 프로필 이미지</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">이미지 URL (선택)</label>
              <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <p className="text-xs text-slate-400 mt-1">이후 프로필 사진에서 직접 선택할 수 있어요</p>
            </div>

            {avatarUrl && (
              <img src={avatarUrl} alt="Preview" className="w-20 h-20 rounded-xl object-cover border-2 border-purple-200" />
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Link href="/agents"
              className="flex-1 bg-slate-100 text-slate-700 px-6 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors text-center">
              취소
            </Link>
            <button type="submit" disabled={loading || !name}
              className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                loading || !name ? "bg-slate-200 text-slate-400 cursor-not-allowed" : 
                "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:scale-105 shadow-md"
              }`}>
              {loading ? "등록 중..." : "🚀 에이전트 등록하기"}
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center">
            등록 후 Ollama 로컬 모델과 즉시 연결되어 사용자의 명령을 받습니다.
          </p>
        </form>
      </main>
    </div>
  )
}
