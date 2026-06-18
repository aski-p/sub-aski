import { NextRequest, NextResponse } from "next/server"

const SPA = "https://hyovtguangyykehxwnvp.supabase.co/rest/v1"
const getToken = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

function headers(auth: boolean = true) {
  const h: Record<string, string> = {
    "apikey": getToken(),
    "Content-Type": "application/json",
  }
  if (auth) h["Authorization"] = `Bearer ${getToken()}`
  return h
}

// GET /api/agents - 모든 에이전트 목록 + 롤 정보 JOIN
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get("user_id")

    let query = `${SPA}/sub_agents?select=*,roles(id,name,icon,color,description)`
    if (userId) {
      query += `&user_id=eq.${userId}`
    } else {
      query += `&order=created_at.desc`
    }

    const res = await fetch(query, { headers: headers(false) })

    if (!res.ok) return NextResponse.json({ error: "Supabase 오류" }, { status: 502 })

    const agents = await res.json()
    return NextResponse.json(agents)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/agents - 에이전트 등록 (즉시 Ollama 연결 테스트 + 태스크 생성)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, role_id, description, avatar_url, user_id } = body

    if (!name || !user_id) {
      return NextResponse.json({ error: "이름과 사용자 ID가 필요합니다" }, { status: 400 })
    }

    // 1. Supabase에 에이전트 저장
    const insertRes = await fetch(`${SPA}/sub_agents`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        name,
        user_id,
        role_id: role_id || null,
        description: description || null,
        avatar_url: avatar_url || null,
        status: "active",
        task_count: 0,
        success_rate: 100,
      }),
    })

    if (!insertRes.ok) {
      const err = await insertRes.text()
      return NextResponse.json({ error: `저장 실패: ${err}` }, { status: 502 })
    }

    const agent = await insertRes.json()

    let greeting = ""

    // 2. Ollama 연결 테스트 - 에이전트 이름으로 시스템 프롬프트 생성 및 테스트
    try {
      const testRes = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen3-coder:30b",
          messages: [
            { role: "system", content: `너는 "${name}"이라는 이름의 AI 에이전트다. 간단한 자기소개를 해라.` },
            { role: "user", content: "안녕?" },
          ],
          stream: false,
        }),
      })

      let greeting = ""
      if (testRes.ok) {
        const data = await testRes.json()
        greeting = data.message?.content || "연결됨"
      } else {
        greeting = "Ollama 연결 실패"
      }

      // 태스크 추가 생성
      const taskRes = await fetch(`${SPA}/tasks`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          agent_id: agent.id,
          user_id,
          title: `[${name}] 초기 활성화`,
          description: `에이전트 "${name}"이(가) 생성되었습니다. Ollama 테스트 응답: ${greeting}`,
          status: "completed",
          priority: "low",
          type: "initialization",
        }),
      })
    } catch (ollamaErr: any) {
      console.error("Ollama test failed:", ollamaErr.message)
    }

    return NextResponse.json({ ...agent, greeting }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH /api/agents/:id - 에이전트 정보 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: "ID 필요합니다" }, { status: 400 })

    const res = await fetch(`${SPA}/sub_agents?select=*`, {
      headers: headers(),
    }).then(r => r.json())

    const agent = (res as any[]).find((a: any) => a.id === id)
    if (!agent) return NextResponse.json({ error: "에이전트를 찾을 수 없음" }, { status: 404 })

    const patchRes = await fetch(`${SPA}/sub_agents?id=eq.${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(updates),
    })

    if (!patchRes.ok) return NextResponse.json({ error: "수정 실패" }, { status: 502 })

    const updated = await patchRes.json()
    return NextResponse.json(updated[0])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/agents/:id
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID 필요합니다" }, { status: 400 })

    await fetch(`${SPA}/sub_agents?id=eq.${id}`, { method: "DELETE", headers: headers() })
    await fetch(`${SPA}/tasks?agent_id=eq.${id}`, { method: "DELETE", headers: headers() })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
