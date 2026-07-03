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
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [images, setImages] = useState<ImgItem[]>([])
  const [imgLoading, setImgLoading] = useState(true)
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string>("")
  const [isRoleOpen, setIsRoleOpen] = useState(false)

  useEffect(() => {
    fetch("/api/roles")
      .then(r => r.ok ? r.json() : [])
      .then(setRoles)
      .catch(() => {})
    fetch("/api/profile-images")
      .then(r => r.json())
      .then(data => {
        setImages(data.images || [])
        setImgLoading(false)
      })
      .catch(() => setImgLoading(false))
  }, [])

  const testOllama = async () => {
    if (!name) return
    setTesting(true)
    setOllamaTest(null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitError(null)
    setSubmitSuccess(null)
    try {
      let session = null
      try {
        const { data: { session: s } } = await supabase.auth.getSession()
        session = s
      } catch {}

      if (!session) {
        const local = localStorage.getItem("subaski_session")
        if (!local) {
          setSubmitError("로그인이 필요합니다")
          return router.push("/login")
        }
        const parsed = JSON.parse(local)
        session = { user: { id: parsed.id } }
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

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const errMsg = data?.error || `등록 실패 (HTTP ${res.status})`
        setSubmitError(errMsg)
        return
      }

      setSubmitSuccess("에이전트가 등록되었습니다! 채팅 페이지로 이동합니다...")
      await new Promise(resolve => setTimeout(resolve, 600))
      router.push(`/agents/chat/${data.id}`)
    } catch (err: any) {
      setSubmitError(`에이전트 등록 실패: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = roles.find(r => r.id === roleId)

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Header />

      {/* Hero header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/20 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <Link href="/agents" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-400 transition-colors mb-6">
            <span className="text-base">←</span> 에이전트 목록으로 돌아가기
          </Link>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              새 에이전트 등록
            </span>
          </h1>
          <p className="text-slate-400 text-lg">이름, 역할, 아바타를 설정하고 AI 에이전트를 활성화하세요</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status messages */}
        {submitError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-lg">⚠️</span>
            </div>
            <div>
              <p className="font-bold text-sm mb-0.5">등록 실패</p>
              <p className="text-sm opacity-90 leading-relaxed">{submitError}</p>
            </div>
          </div>
        )}
        {submitSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-3 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-lg">✅</span>
            </div>
            <div>
              <p className="font-bold text-sm mb-0.5">등록 완료</p>
              <p className="text-sm opacity-90 leading-relaxed">{submitSuccess}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: form inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-900/60 backdrop-blur-xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-400">①</div>
                  <h3 className="font-bold text-lg text-white">기본 정보</h3>
                </div>

                <div className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">에이전트 이름 *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                      maxLength={50} placeholder="예: 요한나, 김채원..."
                      className="w-full px-5 py-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all text-[15px]" />
                  </div>

                  {/* Ollama test */}
                  {name && (
                    <div className="space-y-3">
                      <button type="button" onClick={testOllama} disabled={testing}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                          testing ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" :
                          ollamaTest && !ollamaTest.startsWith("❌") ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                          "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60"
                        }`}>
                        {testing ? "🔄 테스트 중..." : ollamaTest && !ollamaTest.startsWith("❌") ? "✅ 연결 확인됨" : "🧪 Ollama 연결 테스트"}
                      </button>
                      {ollamaTest && (
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex items-start gap-3">
                          <span className="text-xl">🤖</span>
                          <div>
                            <p className="text-sm font-bold text-indigo-400 mb-1">{name}:</p>
                            <p className="text-sm text-slate-300 leading-relaxed">{ollamaTest}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Role select */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">역할</label>
                    <div className="relative">
                      <button type="button" onClick={() => setIsRoleOpen(!isRoleOpen)}
                        className="w-full px-5 py-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-left text-white flex items-center justify-between hover:border-slate-600 transition-all">
                        <span className={roleId ? "text-white" : "text-slate-500"}>
                          {selectedRole ? `${selectedRole.icon} ${selectedRole.name}` : "직접 선택"}
                        </span>
                        <span className="text-slate-400 transition-transform duration-200" style={{ transform: isRoleOpen ? "rotate(180deg)" : "rotate(0deg)" }}>⌄</span>
                      </button>
                      {isRoleOpen && (
                        <div className="absolute z-20 w-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl">
                          {roles.length === 0 ? (
                            <div className="px-5 py-4 text-sm text-slate-500">역할을 불러오는 중...</div>
                          ) : (
                            roles.map(r => (
                              <button key={r.id} type="button" onClick={() => { setRoleId(r.id); setIsRoleOpen(false) }}
                                className={`w-full px-5 py-3 text-left text-sm hover:bg-slate-700/60 transition-colors flex items-center gap-3 ${
                                  roleId === r.id ? "bg-indigo-500/10 text-indigo-400" : "text-slate-300"
                                }`}>
                                <span className="text-lg">{r.icon}</span>
                                <div>
                                  <div className="font-medium">{r.name}</div>
                                  {r.description && <div className="text-xs text-slate-500 mt-0.5">{r.description}</div>}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">설명</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                      placeholder="이 에이전트의 주요 역할과 특기를 적어보세요..."
                      className="w-full px-5 py-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all resize-none text-[15px] leading-relaxed" />
                  </div>

                  {/* Avatar URL */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">아바타 URL</label>
                    <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-5 py-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all text-[15px]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: image picker */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-900/60 backdrop-blur-xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-400">②</div>
                  <h3 className="font-bold text-lg text-white">프로필 이미지</h3>
                </div>

                {selectedPreviewUrl && (
                  <div className="flex flex-col items-center gap-3 mb-6">
                    <div className="relative group">
                      <img src={selectedPreviewUrl} alt="프로필 이미지"
                        className="w-28 h-36 object-cover rounded-2xl border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/20" />
                      <button type="button" onClick={() => { setSelectedPreviewUrl(""); setAvatarUrl("") }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        ✕
                      </button>
                    </div>
                    <span className="text-xs text-indigo-400 font-medium px-3 py-1 bg-indigo-500/10 rounded-full">선택됨</span>
                  </div>
                )}

                {imgLoading ? (
                  <div className="text-center py-10 bg-slate-800/30 rounded-2xl border border-slate-700/20 animate-pulse">
                    <div className="w-8 h-8 border-2 border-slate-600 border-t-indigo-400 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500">이미지 로딩 중...</p>
                  </div>
                ) : images.length === 0 ? (
                  <div className="text-center py-10 bg-slate-800/20 rounded-2xl border border-slate-700/20">
                    <div className="text-4xl mb-3 opacity-50">🖼️</div>
                    <p className="text-sm text-slate-500 leading-relaxed">프로필 이미지가 없습니다.<br/>ComfyUI에서 이미지를 생성해주세요.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-[360px] overflow-y-auto p-1 bg-slate-800/20 rounded-2xl border border-slate-700/20">
                    {images.map(img => (
                      <button key={img.id} type="button" onClick={() => {
                        setSelectedPreviewUrl(img.url)
                        setAvatarUrl(img.filename.includes("prof_") ? img.url : `/nas/profiles/${img.filename}`)
                      }}
                        className={`aspect-[3/4] rounded-xl overflow-hidden transition-all duration-200 ${
                          selectedPreviewUrl === img.url
                            ? "ring-2 ring-pink-400 scale-95 shadow-lg shadow-pink-500/20"
                            : "hover:scale-[1.03] hover:ring-1 hover:ring-indigo-400/40"
                        }`}>
                        <img src={img.url} alt={img.filename} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}

                {!imgLoading && images.length > 0 && (
                  <p className="text-xs text-slate-500 mt-3 text-center">총 {images.length}개 이미지</p>
                )}
              </div>
            </div>
          </div>

          {/* Full-width submit */}
          <div className="lg:col-span-3 pb-8">
            <button type="submit" disabled={loading || !name}
              className="w-full py-5 rounded-2xl font-bold text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.99]">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  등록 중...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span>✨</span> 에이전트 등록하기
                </span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
