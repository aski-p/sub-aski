import { NextRequest, NextResponse } from "next/server"

const OLLAMA_BASE = "http://localhost:11434"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, message, chatHistory = [] } = body

    if (!agentId || !message) {
      return NextResponse.json({ error: "agentId와 message가 필요합니다" }, { status: 400 })
    }

    // Fetch agent info from Supabase
    const supabaseRes = await fetch(
      `https://hyovtguangyykehxwnvp.supabase.co/rest/v1/sub_agents?id=eq.${agentId}`,
      {
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          "Prefer": "count=exact",
        },
      }
    )

    if (!supabaseRes.ok) {
      return NextResponse.json({ error: "에이전트 정보를 불러올 수 없습니다" }, { status: 500 })
    }

    const agents = await supabaseRes.json()
    if (agents.length === 0) {
      return NextResponse.json({ error: "에이전트를 찾을 수 없습니다" }, { status: 404 })
    }

    const agent = agents[0]

    // Fetch role to determine system prompt
    let systemPrompt = `너는 "${agent.name}"이라는 이름의 AI 에이전트다. 사용자의 요청에 성실히 응답한다. 한국어로 대답한다.`

    if (agent.role_id) {
      const roleRes = await fetch(
        `https://hyovtguangyykehxwnvp.supabase.co/rest/v1/roles?id=eq.${agent.role_id}`,
        {
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
        }
      )

      if (roleRes.ok) {
        const roles = await roleRes.json()
        if (roles.length > 0) {
          systemPrompt = `너는 "${agent.name}"이고, 역할은 "${roles[0].name}"이다.\n${roles[0].description || ""}\n\n사용자의 요청에 성실히 응답한다. 한국어로 대답한다.`
        }
      }
    }

    if (agent.description) {
      systemPrompt += `\n\n추가 정보: ${agent.description}`
    }

    // Build messages array with system prompt
    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      { role: "user", content: message },
    ]

    // Call Ollama
    const ollamaRes = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen3-coder:30b",
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
    })

    if (!ollamaRes.ok) {
      const errMsg = await ollamaRes.text()
      return NextResponse.json({ error: `Ollama 오류: ${errMsg}` }, { status: 502 })
    }

    const data = await ollamaRes.json()
    const reply = data.message?.content || "응답을 받을 수 없습니다"

    // Update task_count on agent
    try {
      await fetch(
        `https://hyovtguangyykehxwnvp.supabase.co/rest/v1/sub_agents`,
        {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
          },
          body: JSON.stringify({ task_count: agent.task_count + 1 }),
        }
      )
    } catch {}

    return NextResponse.json({
      reply,
      agentName: agent.name,
      tokenCount: data.total_duration ? Math.round(data.total_duration / 1e9) : 0,
    })
  } catch (err: any) {
    console.error("Chat API error:", err)
    return NextResponse.json({ error: err.message || "서버 오류" }, { status: 500 })
  }
}
