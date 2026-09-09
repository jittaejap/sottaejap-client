import type {
  CompanionTag,
  PurposeTag,
  ReflectionStep,
  Satisfaction,
  SuggestionStatus,
} from '@/api/enums'
import { httpClient } from '@/api/httpClient'
import type {
  Analysis,
  BehaviorDetail,
  Goal,
  MonthlyReport,
  NotificationItem,
  RetrospectCandidate,
  RetrospectChatMessage,
  RetrospectChatResult,
  RetrospectReflection,
  SatisfactionMap,
  Suggestion,
  TransactionUploadResult,
  TransactionPage,
  UserMe,
} from '@/api/types'

type LoginResponse = { accessToken: string; tokenType: 'Bearer'; expiresAt: string }

export async function loginLocal() {
  const response = await httpClient.post<LoginResponse>('/auth/login', { provider: 'LOCAL' })
  return response.data
}

export async function loginKakao(code: string, redirectUri: string) {
  const response = await httpClient.post<LoginResponse>('/auth/login', {
    provider: 'KAKAO',
    code,
    redirectUri,
  })
  return response.data
}

export async function getCurrentUser() {
  const response = await httpClient.get<UserMe>('/users/me')
  return response.data
}

export async function createGoal(input: {
  name: string
  targetAmount: number
  targetDate?: string
  currentAmount?: number
}) {
  const response = await httpClient.post<Goal>('/goals', input)
  return response.data
}

export async function getGoals() {
  const response = await httpClient.get<{ goals: Goal[] }>('/goals')
  return response.data.goals
}

export async function updateGoal(
  goalId: number,
  input: { name: string; targetAmount: number; targetDate?: string; currentAmount?: number },
) {
  const response = await httpClient.put<Goal>(`/goals/${goalId}`, input)
  return response.data
}

export async function uploadTransactions(file: File) {
  const form = new FormData()
  form.append('file', file)
  const response = await httpClient.post<TransactionUploadResult>('/transactions/upload', form)
  return response.data
}

export async function getTransactions(params: {
  from?: string
  to?: string
  category?: string
  hasRetrospect?: boolean
  page?: number
  size?: number
}) {
  const response = await httpClient.get<TransactionPage>('/transactions', { params })
  return response.data
}

export async function updateSettings(input: {
  monthlyBudget?: number
  outlierThreshold?: number
  retrospectDelayDays?: number
}) {
  const response = await httpClient.put<UserMe>('/users/me/settings', input)
  return response.data
}

export async function startOnboarding(input: {
  sampleSize: number
  periodFrom: string
  periodTo: string
}) {
  const response = await httpClient.post<{ candidates: RetrospectCandidate[] }>(
    '/onboarding/start',
    input,
  )
  return response.data.candidates
}

/**
 * 05 §2 `GET /retrospects/candidates`.
 * `range`를 주지 않으면 v1.7과 같이 `limit`만 적용한다 — 기존 호출부는 그대로다.
 * 채팅 회고 진입(FR-03-08)은 오늘 포함 최근 3일을 실어 보낸다 (01 E-48).
 */
export async function getRetrospectCandidates(limit: number, range?: { from: string; to: string }) {
  const response = await httpClient.get<{ candidates: RetrospectCandidate[] }>(
    '/retrospects/candidates',
    { params: { limit, ...range } },
  )
  return response.data.candidates
}

export async function saveRetrospect(input: {
  transactionId: number
  satisfaction: Satisfaction
  purpose: PurposeTag
  companion: CompanionTag
  repeatIntent: boolean
  source: 'CANDIDATE' | 'ONBOARDING' | 'MANUAL'
}) {
  const response = await httpClient.post('/retrospects', input)
  return response.data
}

export async function completeOnboarding() {
  const response = await httpClient.post<{ onboardingCompleted: true; clusterCount: number }>(
    '/onboarding/complete',
  )
  return response.data
}

export async function getBehavior(id: number) {
  const response = await httpClient.get<BehaviorDetail>(`/behaviors/${id}`)
  return response.data
}

export async function getSatisfactionMap() {
  const response = await httpClient.get<SatisfactionMap>('/satisfaction-map')
  return response.data
}

export async function getAnalysis() {
  const response = await httpClient.get<Analysis>('/analysis')
  return response.data
}

export async function getSuggestions(status?: SuggestionStatus) {
  const response = await httpClient.get<{ suggestions: Suggestion[] }>('/suggestions', {
    params: status ? { status } : undefined,
  })
  return response.data.suggestions
}

export async function adoptSuggestion(id: number, input: { adjustCount: number; goalId?: number }) {
  const response = await httpClient.post<Suggestion>(`/suggestions/${id}/adopt`, input)
  return response.data
}

export async function rejectSuggestionById(id: number) {
  const response = await httpClient.post<Suggestion>(`/suggestions/${id}/reject`)
  return response.data
}

export async function askFinance(message: string) {
  const response = await httpClient.post<{ reply: string; fallback: boolean }>('/chat/finance', {
    message,
  })
  return response.data
}

export async function getNotifications() {
  const response = await httpClient.get<{
    unreadCount: number
    notifications: NotificationItem[]
  }>('/notifications')
  return response.data
}

export async function readNotification(id: number) {
  await httpClient.post(`/notifications/${id}/read`)
}

export async function getMonthlyReport(yearMonth?: string) {
  const response = await httpClient.get<MonthlyReport>('/reports/monthly', {
    params: yearMonth ? { yearMonth } : undefined,
  })
  return response.data
}

/**
 * 05 §2 `POST /retrospects/chat` (01 E-63) — 상태 없는 프록시다.
 * 회고 행을 만들지 않는다. 저장은 언제나 `saveRetrospect`다.
 * `message`는 `INTRO`에서만 생략할 수 있고 그 밖에는 필수이며 최대 500자다 (E-112).
 */
export async function chatRetrospect(input: {
  transactionId: number
  message?: string
  step: ReflectionStep
  reflection: RetrospectReflection
  recentMessages: RetrospectChatMessage[]
}) {
  const response = await httpClient.post<RetrospectChatResult>('/retrospects/chat', input)
  return response.data
}

/**
 * 05 §2 #28 `POST /chat/analysis` (01 E-104) — 상태 없는 프록시다.
 * 서버는 이력을 저장하지 않으므로 소비 분석 채널의 최근 대화를 클라이언트가 들고 다닌다.
 * `message`는 1~500자, `recentMessages`는 오름차순이고 서버가 최근 6건만 AI에 넘긴다 (E-87).
 */
export async function askAnalysis(message: string, recentMessages: RetrospectChatMessage[]) {
  const response = await httpClient.post<{ reply: string; fallback: boolean }>('/chat/analysis', {
    message,
    recentMessages,
  })
  return response.data
}

/** 05 §2 `DELETE /goals/{id}` — soft delete다. 채택 이력(`suggestions.goal_id`)은 서버가 그대로 둔다 (E-83). */
export async function deleteGoal(goalId: number) {
  await httpClient.delete(`/goals/${goalId}`)
}
