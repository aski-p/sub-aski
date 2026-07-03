'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 메인 페이지에서 에이전트 페이지로 자동 이동
    router.push('/agents');
  }, [router]);

  return null;
}