import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "서브에이전트 | 한국형 AI 에이전트 제어실",
  description: "AI 에이전트를 효율적으로 제어하고 관리하는 플랫폼",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">{children}</body>
    </html>
  )
}
