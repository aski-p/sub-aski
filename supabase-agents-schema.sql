-- ============================================================
-- Sub-Agent Management Schema Extension
-- ============================================================

-- ROLES TABLE (에이전트 역할 정의)
create table if not exists roles (
  id uuid default gen_random_uuid() primary key,
  name text not null unique check (char_length(name) <= 50),
  description text check (char_length(description) <= 500),
  icon text default '🤖' check (char_length(icon) <= 10),
  color text default '#8b5cf6',
  created_at timestamptz default now()
);

alter table roles enable rowlevel security;
create policy "roles_view_all" on roles for select using (true);
create policy "roles_admin_only" on roles for all using (true);

-- Insert default roles
insert into roles (name, description, icon, color) values
  ('이미지 생성', 'AI 이미지 생성 및 편집', '🎨', '#ec4899'),
  ('콘텐츠 심사', '업로드 콘텐츠 적정성 검토', '🔍', '#3b82f6'),
  ('사용자 지원', '고객 문의 및 가이드', '💬', '#10b981'),
  ('데이터 분석', '이용 통계 및 인사이트', '📊', '#f59e0b'),
  ('마케팅', '홍보物料 및 소셜 미디어 관리', '📣', '#ef4444'),
  ('코드 리뷰', '코드 품질 점검 및 보안 스캔', '🔧', '#6366f1')
on conflict (name) do nothing;

-- SUB_AGENTS TABLE (서브 에이전트 등록)
create table if not exists sub_agents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null check (char_length(name) <= 50),
  role_id uuid references roles(id) on delete set null,
  avatar_url text,
  description text check (char_length(description) <= 1000),
  status text default 'active' check (status in ('active', 'idle', 'busy', 'offline')),
  task_count integer default 0 check (task_count >= 0),
  success_rate numeric(4,2) default 0 check (success_rate between 0 and 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table sub_agents enable rowlevel security;
create policy "agents_view_all" on sub_agents for select using (true);
create policy "agents_insert_own" on sub_agents for insert with check (auth.uid() = user_id);
create policy "agents_update_own" on sub_agents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "agents_delete_own" on sub_agents for delete using (auth.uid() = user_id);

-- PROFILE_PHOTOS TABLE (에이전트 프로필 사진 풀 - 100명 여성写真)
create table if not exists profile_photos (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  style text not null check (char_length(style) <= 50),
  tags text[] default '{}',
  created_at timestamptz default now()
);

alter table profile_photos enable rowlevel security;
create policy "photos_view_all" on profile_photos for select using (true);
create policy "photos_admin_only" on profile_photos for all using (true);

-- TASKS TABLE (업무 투입/할당)
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references sub_agents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null check (char_length(title) <= 200),
  description text check (char_length(description) <= 2000),
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'failed')),
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  type text not null check (char_length(type) <= 50),
  result_url text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table tasks enable rowlevel security;
create policy "tasks_view" on tasks for select using (true);
create policy "tasks_insert_own" on tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-update updated_at on sub_agents
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_sub_agents_updated_at
  before update on sub_agents
  for each row execute function update_updated_at_column();

-- Grant permissions
grant select, insert, update, delete on roles to authenticated;
grant select, insert, update, delete on sub_agents to authenticated;
grant select, insert, update, delete on tasks to authenticated;
grant select on profile_photos to authenticated;
