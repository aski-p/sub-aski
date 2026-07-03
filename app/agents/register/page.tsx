"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/Header"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Role } from "@/lib/types"

interface ImgItem { id: string; filename: string; url: string }

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

  // Profile images for picker
  const [images, setImages] = useState<ImgItem[]>([])
  const [imgLoading, setImgLoading] = useState(true)
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string>("")

  useEffect(() => {
    fetch("/api/roles").then(r => r.json()).then(setRoles).catch(console.error)
    fetch("/api/profile-images")
      .then(r => r.json())
      .then(data => {
        setImages(data.images || [])
        setImgLoading(false)
      })
      .catch(() => setImgLoading(false))
  }, [])

  // Ollama 연결 테스트
  const testOllama = async () => {
    if (!name) return
    setTesting(true)
    try {
      const res = await fetch("/api/ollama-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "qwen3.6:27b", name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "응답 실패")
      setOllamaTest(data.content || "연결 성공!")
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
          avatar_url: avatarUrl || selectedPreviewUrl || null,
          user_id: session.user.id,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "등록 실패")
      }

      const agent = await res.json()
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push(`/agents/chat/${agent.id}`)
    } catch (err: any) {
      alert(`에이전트 등록 실패: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back link */}
        <Link href="/agents" className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium mb-6 transition-colors">
          <span>←</span> 에이전트 목록으로 돌아가기
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            🤖 새 에이전트 등록
          </h1>
          <p className="text-slate-400 mt-2">에이전트의 이름, 역할, 아바타를 설정하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic Info Card */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/80 backdrop-blur-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="p-6 space-y-5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm">①</span>
                기본 정보
              </h3>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">이름 *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  maxLength={50} placeholder="예: 요한나, 김채원..."
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-transparent transition-all" />
              </div>

              {/* Ollama test */}
              {name && (
                <div className="flex flex-col gap-3">
                  <button type="button" onClick={testOllama} disabled={testing}
                    className={`self-start px-4 py-2 rounded-lg font-bold text-sm transition-all ${testing ? "bg-indigo-500/30 text-indigo-300" : ollamaTest ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"}`}>
                    {testing ? "🔄 테스트 중..." : ollamaTest && !ollamaTest.startsWith("❌") ? "✅ 연결 확인됨!" : "🧪 Ollama 연결 테스트"}
                  </button>
                  {ollamaTest && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <span role="img" aria-label="에이전트">🤖</span>
                        <div>
                          <p className="text-sm font-bold text-indigo-400 mb-1">{name}:</p>
                          <p className="text-sm text-slate-300">{ollamaTest}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Role select */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">역할</label>
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-transparent transition-all appearance-none">
                  <option value="">직접 선택</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">설명</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  placeholder="이 에이전트의 주요 역할과 특기를 적어보세요..."
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-transparent transition-all resize-none" />
              </div>

              {/* Avatar url */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">아바타 URL</label>
                <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="URL 입력 또는 아래 이미지 선택..."
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-transparent transition-all" />
              </div>
            </div>
          </div>

          {/* Profile Image Picker */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/80 backdrop-blur-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
            <div className="p-6 space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm">②</span>
                프로필 이미지 선택
              </h3>

              {imgLoading && (
                <div className="text-center py-8 bg-slate-800/30 rounded-xl animate-pulse border border-slate-700/30">
                  이미지 로딩 중...
                </div>
              )}

              {!imgLoading && images.length === 0 && (
                <p className="text-amber-400 text-sm bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                  프로필 이미지가 없습니다. ComfyUI에서 이미지를 생성해주세요.
                </p>
              )}

              {!imgLoading && images.length > 0 && (
                <>
                  {/* Selected Preview */}
                  {selectedPreviewUrl && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative group">
                        <img src={selectedPreviewUrl} alt="선택된 미리보기"
                          className="w-32 h-40 object-cover rounded-xl border-2 border-indigo-500 shadow-lg shadow-indigo-500/25 transition-all" />
                        <div className="absolute -top-1 -right-1 bg-emerald-500 text-white w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs shadow-lg">✓</div>
                      </div>
                      <span className="text-xs text-indigo-400 font-medium">선택됨</span>
                    </div>
                  )}

                  {/* Image Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto p-1 bg-slate-800/20 rounded-xl border border-slate-700/30">
                    {images.map(img => (
                      <div key={img.id} onClick={() => {
                        setSelectedPreviewUrl(img.url)
                        setAvatarUrl(img.filename.includes("prof_") ? img.url : `/nas/profiles/${img.filename}`)
                      }}
                        className={`cursor-pointer group relative rounded-lg overflow-hidden transition-all ${selectedPreviewUrl === img.url ? "ring-2 ring-pink-400 scale-[1.02]" : "hover:scale-[1.02] hover:ring-1 hover:ring-indigo-400/50"}`}>
                        <img src={img.url} alt={img.filename} className="w-full h-auto aspect-[3/4] object-cover rounded-lg" />
                        {selectedPreviewUrl === img.url && (
                          <div className="absolute inset-0 bg-pink-500/10 flex items-center justify-center">
                            <div className="bg-pink-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">✓</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500">총 {images.length}개 프로필 이미지 — 클릭하면 선택됩니다 ✨</p>
                </>
              )}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading || !name}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl px-8 py-4 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
            {loading ? "⏳ 등록 중..." : "✅ 에이전트 등록하기"}
          </button>

        </form>
      </main>
    </div>
  )
}
