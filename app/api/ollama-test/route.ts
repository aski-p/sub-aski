import { NextResponse } from "next/server"

const OLLAMA_BASE = process.env.OLLAMA_BASE || "http://localhost:11434"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const isLocal = OLLAMA_BASE.includes("localhost") || OLLAMA_BASE.includes("127.0.0.1")
    if (isLocal && process.env.VERCEL) {
      return NextResponse.json({ content: "프로덕션 환경에서는 로컬 Ollama 테스트를 실행할 수 없습니다." })
    }

    const { model, name, message } = await request.json()

    if (!model || !name) {
      return NextResponse.json({ error: 'model과 name이 필요합니다.' }, { status: 400 })
    }

    const ollamaRes = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: `너는 "${name}"이라는 이름의 AI 에이전트다. 간단히 자기소개를 하세요.` },
          { role: 'user', content: message || '안녕! 뭐 할 거야?' },
        ],
        stream: false,
      }),
    })

    if (!ollamaRes.ok) {
      const text = await ollamaRes.text()
      return NextResponse.json({ error: `Ollama 오류: ${ollamaRes.status} ${text}` }, { status: 502 })
    }

    const data = await ollamaRes.json()
    return NextResponse.json({ content: data.message?.content || '응답 없음' })
  } catch (err: any) {
    return NextResponse.json({ error: `연결 실패: ${err.message}` }, { status: 500 })
  }
}
