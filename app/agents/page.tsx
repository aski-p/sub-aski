"use client"
import Header from "@/components/Header"
import Link from "next/link"
import { useEffect, useState } from "react"
import type { SubAgent, Role, Task } from "@/lib/types"

export default function AgentsPage() {
  const [agents, setAgents] = useState<SubAgent[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, active: 0, idle: 0, busy: 0, offline: 0 })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [aRes, rRes, tRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/roles"),
        fetch("/api/tasks?order=created_at.desc&limit=20").then(r => r.json()).catch(() => []),
      ])

      const agentsData = await aRes.ok ? await aRes.json() : []
      const rolesData = await rRes.ok ? await rRes.json() : []

      setAgents(agentsData)
      setRoles(rolesData)
      setTasks(tRes || [])

      setStats({
        total: agentsData.length,
        active: agentsData.filter((a: SubAgent) => a.status === "active").length,
        idle: agentsData.filter((a: SubAgent) => a.status === "idle").length,
        busy: agentsData.filter((a: SubAgent) => a.status === "busy").length,
        offline: agentsData.filter((a: SubAgent) => a.status === "offline").length,
      })
    } finally {
      setLoading(false)
    }
  }

  const getRole = (roleId?: string | null) => {
    if (!roleId) return { name: "미지정", icon: "🎭", color: "#94a3b8" }
    return roles.find((r: Role) => r.id === roleId) || { name: "알 수 없음", icon: "❓", color: "#666" }
  }

  const statusColors = {
    active: "bg-green-100 text-green-700",
    idle: "bg-slate-100 text-slate-600",
    busy: "bg-yellow-100 text-yellow-700",
    offline: "bg-red-100 text-red-700",
  }

  const statusLabels = { active: "활성화", idle: "대기중", busy: "작업중", offline: "오프라인" }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>로딩 중...</p></div>

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">🤖 서브 에이전트 관리</h1>
            <p className="text-slate-500">에이전트를 등록하고 롤을 부여하며 업무를 투입하세요</p>
          </div>
          <Link href="/agents/register"
            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all shadow-md flex items-center gap-2">
            ➕ 새 에이전트 등록
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: "전체", value: stats.total, emoji: "🤖", bg: "bg-slate-50" },
            { label: "활성화", value: stats.active, emoji: "✅", bg: "bg-green-50" },
            { label: "대기중", value: stats.idle, emoji: "⏸️", bg: "bg-slate-100" },
            { label: "작업중", value: stats.busy, emoji: "🔥", bg: "bg-yellow-50" },
            { label: "오프라인", value: stats.offline, emoji: "⭕", bg: "bg-red-50" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center border border-slate-100`}>
              <div className="text-xl mb-1">{s.emoji}</div>
              <div className="text-2xl font-extrabold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Agents list */}
        {agents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="text-5xl mb-4">👻</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">아직 에이전트가 없어요</h3>
            <p className="text-slate-500 mb-6">첫 번째 에이전트를 등록해보세요!</p>
            <Link href="/agents/register"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors">
              에이전트 만들기 ➜
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {agents.map(agent => {
              const role = getRole(agent.role_id)
              return (
                <div key={agent.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow overflow-hidden">
                  {/* Agent card header */}
                  <div className="h-2 bg-gradient-to-r" style={{ backgroundColor: role?.color || "#8b5cf6" }} />

                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xl font-bold"
                        style={{ backgroundColor: role?.color || "#8b5cf6" }}>
                        {agent.avatar_url ? (
                          <img src={agent.avatar_url} className="w-full h-full rounded-xl object-cover" alt={agent.name} />
                        ) : role?.icon || "🤖"}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-lg truncate">{agent.name}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <span>{role?.icon}</span>
                          <span>{role?.name}</span>
                        </p>
                      </div>

                      {/* Status badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[agent.status as keyof typeof statusColors]}`}>
                        {statusLabels[agent.status as keyof typeof statusLabels]}
                      </span>
                    </div>

                    {agent.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{agent.description}</p>
                    )}

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <div className="font-bold text-slate-900">{agent.task_count}</div>
                        <div className="text-xs text-slate-400">작업</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <div className="font-bold text-slate-900">{agent.success_rate}%</div>
                        <div className="text-xs text-slate-400">성공률</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <div className="font-bold text-slate-900">{agent.role ? "✅" : "⚠️"}</div>
                        <div className="text-xs text-slate-400">롤</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/agents/chat/${agent.id}`}
                        className="flex-1 bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-100 transition-colors text-center">
                        💬 채팅
                      </Link>
                      <button onClick={() => changeStatus(agent.id)}
                        className="flex-1 bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
                        {agent.status === "offline" ? "켜기" : "끄기"}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Recent tasks */}
        {tasks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">📋 최근 작업</h2>
            <div className="space-y-3">
              {tasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    task.status === "completed" ? "bg-green-500" : task.status === "in_progress" ? "bg-yellow-500 animate-pulse" : task.status === "failed" ? "bg-red-500" : "bg-slate-300"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{task.title}</p>
                    <p className="text-xs text-slate-500">{new Date(task.created_at).toLocaleString("ko-KR")}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    task.priority === "urgent" ? "bg-red-100 text-red-700" : task.priority === "high" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {task.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

async function changeStatus(agentId: string) {
  try {
    await fetch("/api/agents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: agentId, status: "offline" }),
    })
    location.reload()
  } catch (err) {
    console.error("상태 변경 실패:", err)
  }
}
