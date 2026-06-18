"use client"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/components/Header"
import Link from "next/link"
import type { SubAgent, Role } from "@/lib/types"

interface Message {
  role: string
  content: string
}

export default function AgentChatPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params?.id as string
  const [agent, setAgent] = useState<SubAgent | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadAgentInfo()
  }, [agentId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadAgentInfo = async () => {
    try {
      let localAgent: SubAgent | null = null

      const res = await fetch(`/api/agents`)
      if (res.ok) {
        const agents = await res.json()
        localAgent = agents.find((a: SubAgent) => a.id === agentId) || null
        setAgent(localAgent)

        if (localAgent?.role_id) {
          const rolesRes = await fetch("/api/roles")
          if (rolesRes.ok) {
            const roles = await rolesRes.json()
            const foundRole = roles.find((r: Role) => r.id === (localAgent as SubAgent).role_id) || null
            setRole(foundRole)
          }
        }
      }

      // Load chat history from localStorage
      const historyKey = `chat_history_${agentId}`
      const saved = localStorage.getItem(historyKey)
      if (saved) {
        try {
          setMessages(JSON.parse(saved))
        } catch {}
      } else {
        const name = localAgent?.name || "에이전트"
        setMessages([{ role: "assistant", content: `${name}을(를)起動했습니다! 명령을 입력하세요.` }])
      }
    } catch (err) {
      console.error("에이전트 정보 로딩 실패:", err)
    }
  }

  const saveHistory = (msgs: Message[]) => {
    localStorage.setItem(`chat_history_${agentId}`, JSON.stringify(msgs.slice(-50)))
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return

    const userMsg: Message = { role: "user", content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setSending(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          message: input.trim(),
          chatHistory: newMessages.slice(-10).filter((m: Message) => m.role === "user"),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "응답 실패")
      }

      const data = await res.json()
      const assistantMsg: Message = { role: "assistant", content: data.reply }
      const allMessages = [...newMessages, assistantMsg]
      setMessages(allMessages)
      saveHistory(allMessages)

    } catch (err: any) {
      console.error("메시지 전송 실패:", err)
      const errorMsg: Message = { role: "assistant", content: `❌ 오류: ${err.message}` }
      setMessages([...newMessages, errorMsg])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([{ role: "assistant", content: "💬 대화 내역을 초기화했습니다." }])
    localStorage.removeItem(`chat_history_${agentId}`)
  }

  if (!agent) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">에이전트를 찾을 수 없습니다</h1>
          <Link href="/agents" className="text-purple-600 hover:underline">← 에이전트 목록으로 돌아가기</Link>
        </main>
      </div>
    )
  }

  const roleColor = role?.color || "#8b5cf6"
  const statusColors = { active: "bg-green-100 text-green-700", idle: "bg-slate-100 text-slate-600", busy: "bg-yellow-100 text-yellow-700", offline: "bg-red-100 text-red-700" }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col">
        {/* Agent header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">
          <div className="flex items-center gap-4">
            <Link href="/agents" className="text-slate-400 hover:text-slate-600 flex-shrink-0">←</Link>
            <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: roleColor }}>
              {agent.avatar_url ? (
                <img src={agent.avatar_url} className="w-full h-full rounded-xl object-cover" alt={agent.name} />
              ) : (role?.icon || "🤖")}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900 truncate">{agent.name}</h2>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <span>{role?.icon || ""} {role?.name || "미지정"}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[agent.status as keyof typeof statusColors]}`}>
                  {agent.status}
                </span>
              </p>
            </div>
            <button onClick={clearChat} className="text-slate-400 hover:text-red-500 text-sm">🗑️ 초기화</button>
          </div>

          {messages.length === 1 && (
            <div className={`mt-3 p-3 rounded-lg`} style={{ backgroundColor: `${roleColor}15` }}>
              <p className="text-sm" style={{ color: roleColor }}>
                🤖 <strong>명령:</strong> &quot;{agent.name}&quot;이라고 말하고 명령을 입력하세요. 이 에이전트는 Ollama 로컬 모델과 연결되어 있습니다.
              </p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4 space-y-3 min-h-[50vh]">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-purple-600 text-white rounded-br-none"
                  : "bg-slate-100 text-slate-900 rounded-bl-none"
              }`}>
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                <div className={`text-xs mt-1 ${msg.role === "user" ? "text-purple-200" : "text-slate-400"}`}>
                  {new Date().toLocaleTimeString("ko-KR")}
                </div>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl px-4 py-3 rounded-bl-none flex items-center gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder={`${agent.name}에게 명령을 입력하세요...`}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className={`px-6 py-3 rounded-xl font-bold transition-all flex-shrink-0 ${
                sending || !input.trim()
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg shadow-md"
              }`}
            >
              {sending ? "⏳" : "🚀"}
            </button>
          </div>

          {/* Quick commands */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              `안녕, ${agent.name}?`,
              "네 역할은 뭐야?",
              "지금 어떤 작업을 할 수 있어?",
              "내 데이터를 분석해줘",
            ].slice(0, 3).map(cmd => (
              <button key={cmd} onClick={() => setInput(cmd)} className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-purple-50 hover:text-purple-600 transition-colors">
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
