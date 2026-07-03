import { redirect } from 'next/navigation'

export default function HomePage() {
  // 리디렉션: 루트 페이지는 에이전트 관리로 이동
  redirect('/agents')
}
