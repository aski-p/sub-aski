import { NextRequest, NextResponse } from "next/server"

const SPA = "https://hyovtguangyykehxwnvp.supabase.co/rest/v1"
const getToken = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

function headersObj() {
  return {
    "Authorization": `Bearer ${getToken()}`,
    "apikey": getToken(),
    "Content-Type": "application/json",
  }
}

// GET /api/tasks
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const agentId = url.searchParams.get("agent_id")
    let query = `${SPA}/tasks?select=*`
    if (agentId) query += `&agent_id=eq.${agentId}`
    query += `&order=created_at.desc`

    const res = await fetch(query, { headers: headersObj() })
    if (!res.ok) return NextResponse.json({ error: "Supabase 오류" }, { status: 502 })
    const tasks = await res.json()
    return NextResponse.json(tasks)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/tasks - 새 작업 할당 + 즉각 Ollama 실행
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agent_id, user_id, title, description, type, priority = "normal" } = body

    // 1. 태스크 DB 등록
    const taskRes = await fetch(`${SPA}/tasks`, {
      method: "POST",
      headers: headersObj(),
      body: JSON.stringify({
        agent_id,
        user_id,
        title,
        description: description || null,
        type,
        priority,
        status: "in_progress",
      }),
    })

    if (!taskRes.ok) return NextResponse.json({ error: "태스크 저장 실패" }, { status: 502 })
    const [task] = await taskRes.json()

    // 2. 에이전트 정보 조회 + Ollama 호출
    const agentRes = await fetch(`${SPA}/sub_agents?id=eq.${agent_id}&select=*,roles(name,description)`, {
      headers: headersObj(),
    })
    const [agent] = await agentRes.json()

    if (agent) {
      let systemPrompt = `너는 "${agent.name}"이라는 이름의 AI 에이전트다.`
      if (agent?.roles && agent.roles.length > 0) {
        systemPrompt += `\n역할: ${agent.roles[0].name} (${agent.roles[0]?.description || ""})`
      }

      // Ollama 실행
      const ollamaRes = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen3-coder:30b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `[작업] ${title}\n\n${description || ""}` },
          ],
          stream: false,
        }),
      })

      let result = null
      if (ollamaRes.ok) {
        const data = await ollamaRes.json()
        result = data.message?.content || "응답 없음"
        // 태스크 완료 업데이트
        await fetch(`${SPA}/tasks?id=eq.${task.id}`, {
          method: "PATCH",
          headers: headersObj(),
          body: JSON.stringify({
            status: "completed",
            result_url: null,
            completed_at: new Date().toISOString(),
          }),
        })
      }

      return NextResponse.json({ task, agent, result }, { status: 201 })
    }

    return NextResponse.json({ error: "에이전트를 찾을 수 없습니다" }, { status: 404 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH /api/tasks - 상태 변경
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: "ID 필요합니다" }, { status: 400 })

    const res = await fetch(`${SPA}/tasks?id=eq.${id}`, {
      method: "PATCH",
      headers: headersObj(),
      body: JSON.stringify(updates),
    })
    if (!res.ok) return NextResponse.json({ error: "수정 실패" }, { status: 502 })
    const data = await res.json()
    return NextResponse.json(data[0])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
