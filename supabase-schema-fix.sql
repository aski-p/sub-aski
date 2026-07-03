-- 서브에이전트 스키마 초기화 (수정본)
-- 오류 수정: ON CONFLICT 구문 오타(WTH→WITH), UNIQUE 제약조건 확인

BEGIN;

-- 1. 기존 테이블 삭제 (순서 중요: 참조관계 고려)
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.sub_agents CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- 2. 역할 테이블
CREATE TABLE public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT '👤',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. 서브에이전트 테이블
CREATE TABLE public.sub_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  role_id UUID REFERENCES public.roles(id),
  description TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'active',
  task_count INTEGER DEFAULT 0,
  success_rate INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 4. 태스크 테이블
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.sub_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  type TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. 기본 역할 데이터 삽입
INSERT INTO public.roles (name, icon, description) VALUES
  ('개발자', '💻', '소프트웨어 개발 및 프로그래밍'),
  ('디자이너', '🎨', 'UI/UX 디자인'),
  ('기획자', '📝', '프로젝트 기획 및 전략'),
  ('데이터 분석가', '📊', '데이터 분석 및 인사이트'),
  ('작성자', '✍️', '콘텐츠 작성 및 카피라이팅')
ON CONFLICT (name) DO NOTHING;

-- 6. RLS 활성화
ALTER TABLE public.sub_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책 (roles는 공개 조회 허용)
CREATE POLICY "역할 공개 조회" ON public.roles FOR SELECT USING (true);
CREATE POLICY "자신의 에이전트 조회" ON public.sub_agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "에이전트 생성" ON public.sub_agents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "자신의 에이전트 수정" ON public.sub_agents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "자신의 에이전트 삭제" ON public.sub_agents FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "자신의 태스크 조회" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "태스크 생성" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "자신의 태스크 수정" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "자신의 태스크 삭제" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- 8. 인덱스
CREATE INDEX IF NOT EXISTS idx_sub_agents_user_id ON public.sub_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON public.tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);

COMMIT;
