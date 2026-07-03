import { redirect } from 'next/navigation';

export default function HomePage() {
  // 페이지 직접 접근 시 에이전트 목록으로 이동
  redirect('/agents');
}