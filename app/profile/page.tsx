"use client"
import Header from "@/components/Header"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { AvatarConfig, ImageItem, Comment } from "@/lib/types"
import { getRankTier, RANK_TIERS } from "@/lib/types"

export default function ProfilePage() {
  const [nickname, setNickname] = useState("")
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null)
  const [points, setPoints] = useState(0)
  const [uploadedImages, setUploadedImages] = useState<ImageItem[]>([])
  
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      
      const nickname = session.user.user_metadata?.nickname || ""
      setNickname(nickname)
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single() as any
        
      if (profile) {
        setAvatarConfig(profile.avatar_config || null)
        setPoints(profile.points || 0)
      }
    }
    check()
  }, [])

  const rank = getRankTier(points)
  const canvasRef = { current: null } as any
  
  // Simple avatar render (reuse logic from AvatarCreator conceptually)
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile card */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-8">
          {/* Banner */}
          <div className={`h-32 bg-gradient-to-r ${rank.name === "diamond" ? "from-purple-600 via-pink-500 to-yellow-400" : rank.name === "platinum" ? "from-indigo-500 to-cyan-400" : rank.name === "gold" ? "from-amber-400 to-orange-500" : rank.name === "silver" ? "from-slate-300 to-slate-400" : "from-orange-300 to-amber-600"}`}
            style={{ position: "relative" }}>
            {rank.name === "diamond" && (
              <div className="absolute inset-0 flex items-center justify-center text-white/20 text-8xl select-none">💎</div>
            )}
          </div>
          
          {/* Avatar + info */}
          <div className="px-8 pb-8 -mt-16">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar canvas container */}
              <div className="relative">
                <canvas ref={canvasRef} width={256} height={256}
                  id="profile-avatar"
                  style={{ 
                    borderRadius: "50%", 
                    border: `4px solid ${rank.name === "diamond" ? "#eab308" : rank.name === "platinum" ? "#a5b4fc" : "white"}`,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.15)" 
                  }}
                />
                {/* Rank badge overlay */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white rounded-full px-4 py-1.5 shadow-lg border-2 border-slate-100">
                  <span className="text-sm">{rank.icon}</span>
                  <span className={`text-xs font-bold ml-1 ${
                    rank.name === "diamond" ? "text-amber-600" : rank.name === "platinum" ? "text-indigo-500" : rank.name === "gold" ? "text-yolk-600" : rank.name === "silver" ? "text-slate-500" : "text-orange-600"
                  }`}>
                    {rank.label}
                  </span>
                </div>
              </div>
              
              {/* Info */}
              <div className="flex-1 pt-4 sm:pt-20">
                <h1 className="text-2xl font-extrabold text-slate-900 mb-1">{nickname || "사용자"}</h1>
                <p className="text-sm text-slate-500 mb-4">AI 에이전트 관리자</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{uploadedImages.length}</div>
                    <div className="text-xs text-slate-500">업로드</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{points}</div>
                    <div className="text-xs text-slate-500">포인트</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold">{rank.icon} {rank.label}</div>
                    <div className="text-xs text-slate-500">계급</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Rank progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <h3 className="font-bold text-slate-900 mb-3">🏆 랭킹 진행률</h3>
          {RANK_TIERS.map(tier => {
            const isCurrent = tier.name === rank.name
            const isPast = points >= tier.minPoints
            const nextTier = RANK_TIERS[RANK_TIERS.indexOf(tier) + 1]
            const progress = nextTier 
              ? Math.min(100, ((points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100)
              : isPast ? 100 : 0
            
            return (
              <div key={tier.name} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>{tier.icon} {tier.label}</span>
                  <span className="text-slate-400">{tier.minPoints}pts</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${isCurrent ? "bg-purple-600" : isPast ? "bg-green-400" : "bg-slate-200"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Uploaded images */}
        <h2 className="text-xl font-extrabold text-slate-900 mb-4">내 이미지</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {uploadedImages.map(img => (
            <div key={img.id} className="aspect-square rounded-xl overflow-hidden shadow-sm">
              <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        {uploadedImages.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="text-4xl mb-3">📸</div>
            <p className="text-slate-500">아직 업로드한 이미지가 없어요</p>
          </div>
        )}
      </main>

      {/* Draw avatar on canvas when profile loads */}
      <AvatarRenderer config={avatarConfig} />
    </div>
  )
}

// Helper to draw avatar on profile page
function AvatarRenderer({ config }: { config: any }) {
  
  useEffect(() => {
    const canvas = document.getElementById("profile-avatar") as HTMLCanvasElement
    if (!canvas || !config) return
    const ctx = canvas.getContext("2d")!
    
    // Reuse simple avatar drawing logic (simplified)
    const drawAvatar = () => {
      ctx.clearRect(0, 0, 256, 256)
      
      // Background
      const grad = ctx.createRadialGradient(128, 128, 40, 128, 128, 140)
      grad.addColorStop(0, "#e9d5ff")
      grad.addColorStop(1, "#fbcfe8")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 256, 256)
      
      const cx = 128, cy = 105
      
      // Body
      ctx.fillStyle = config.clothesColor
      ctx.beginPath()
      ctx.moveTo(cx - 45, 170)
      ctx.quadraticCurveTo(cx, 230, cx + 45, 170)
      ctx.lineTo(cx + 35, 140)
      ctx.lineTo(cx - 35, 140)
      ctx.closePath()
      ctx.fill()
      
      // Neck  
      ctx.fillStyle = config.skinColor
      ctx.fillRect(cx - 12, 132, 24, 18)
      
      // Head
      ctx.beginPath()
      ctx.ellipse(cx, cy, 52, 58, 0, 0, Math.PI * 2)
      ctx.fill()
      
      // Hair (short default)
      ctx.fillStyle = config.hairColor
      ctx.beginPath()
      ctx.ellipse(cx, cy - 18, 54, 32, 0, Math.PI, Math.PI * 2)
      ctx.fill()
      
      // Eyes
      ctx.fillStyle = "#fff"
      ctx.beginPath(); ctx.arc(cx - 16, cy - 5, 9, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx + 16, cy - 5, 9, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = "#2d5be3"
      ctx.beginPath(); ctx.arc(cx - 16, cy - 3, 6, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx + 16, cy - 3, 6, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = "#000"
      ctx.beginPath(); ctx.arc(cx - 16, cy - 3, 3, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx + 16, cy - 3, 3, 0, Math.PI * 2); ctx.fill()
      
      // Mouth (smile)
      ctx.strokeStyle = "#c62828"
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(cx, cy + 24, 10, 0.1, Math.PI - 0.1); ctx.stroke()
    }
    
    drawAvatar()
  }, [config])
  
  return null
}
