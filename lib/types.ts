export interface User {
  id: string
  email?: string
  nickname: string
  avatar_config: AvatarConfig | null
  points: number
  created_at: string
}

export interface AvatarConfig {
  eyes: string
  mouth: string
  nose: string
  hair: string
  clothing: string
  skinColor: string
  hairColor: string
  clothesColor: string
}

export interface ImageItem {
  id: string
  user_id: string
  nickname: string
  category: "animal" | "person" | "object"
  url: string
  prompt?: string
  title: string
  likes: number
  reactions: Record<string, number>
  comment_count: number
  created_at: string
}

export interface Comment {
  id: string
  image_id: string
  user_id: string
  nickname: string
  avatar_config: AvatarConfig | null
  rank_tier: string
  content: string
  created_at: string
}

export const RANK_TIERS = [
  { name: "bronze", label: "브론즈", minPoints: 0, icon: "🥉" },
  { name: "silver", label: "실버", minPoints: 100, icon: "🥈" },
  { name: "gold", label: "골드", minPoints: 500, icon: "🥇" },
  { name: "platinum", label: "플래티넘", minPoints: 1000, icon: "💎" },
  { name: "diamond", label: "다이아몬드", minPoints: 2500, icon: "👑" },
]

export function getRankTier(points: number): typeof RANK_TIERS[number] {
  let tier = RANK_TIERS[0]
  for (const t of RANK_TIERS) {
    if (points >= t.minPoints) tier = t
    else break
  }
  return tier
}

// === SUB-AGENT TYPES ===

export interface Role {
  id: string
  name: string
  description: string | null
  icon: string
  color: string
  created_at: string
}

export interface SubAgent {
  id: string
  user_id: string
  name: string
  role_id: string | null
  avatar_url: string | null
  description: string | null
  status: "active" | "idle" | "busy" | "offline"
  task_count: number
  success_rate: number
  role?: Role | null
}

export interface Task {
  id: string
  agent_id: string
  user_id: string
  title: string
  description: string | null
  status: "pending" | "in_progress" | "completed" | "failed"
  priority: "low" | "normal" | "high" | "urgent"
  type: string
  result_url: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: string
  task_id?: string | null
}

export const DEFAULT_AVATAR_PHOTOS = [
  // These will be populated with generated photos
  "/api/photos/1", "/api/photos/2", "/api/photos/3",
]

export const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  "이미지 생성": `너는 전문 이미지 생성 에이전트다. 사용자의 요청에 맞춰 AI 이미지 프롬프트를 작성하거나 ComfyUI API 명령을 생성한다. 한국어로 응답한다.`,
  "콘텐츠 심사": `너는 콘텐츠 심사 에이전트다. 업로드된 이미지의 적정성을 검토하고 적절한 카테고리를 분류한다. 한국어로 응답한다.`,
  "사용자 지원": `너는 고객 지원 에이전트다. 사용자의 문의에 친절하게 답변하고 가이드를 제공한다. 한국어로 응답한다.`,
  "데이터 분석": `너는 데이터 분석 에이전트다. 플랫폼 이용 통계, 트렌드를 분석하고 인사이트를 제공한다. 한국어로 응답한다.`,
  "마케팅": `너는 마케팅 에이전트다. 홍보 문구를 작성하고 소셜 미디어 게시글을 제안한다. 한국어로 응답한다.`,
  "코드 리뷰": `너는 코드 리뷰 에이전트다. 코드의 품질, 보안, 성능을 점검하고 개선안을 제시한다. 한국어로 응답한다.`,
}
