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

// GET /api/roles
export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${SPA}/roles?select=*&order=name`, { headers: headersObj() })
    if (!res.ok) return NextResponse.json({ error: "Supabase 오류" }, { status: 502 })
    const roles = await res.json()
    return NextResponse.json(roles)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/roles - 롤 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${SPA}/roles`, {
      method: "POST",
      headers: headersObj(),
      body: JSON.stringify({ name: body.name, description: body.description || null, icon: body.icon || "🤖", color: body.color || "#8b5cf6" }),
    })
    if (!res.ok) return NextResponse.json({ error: "저장 실패" }, { status: 502 })
    const data = await res.json()
    return NextResponse.json(data[0], { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
