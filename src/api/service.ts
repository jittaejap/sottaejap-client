import type { CompanionTag, PurposeTag, Satisfaction, SuggestionStatus } from '@/api/enums'
import { httpClient } from '@/api/httpClient'
import type {
  Analysis,
  BehaviorDetail,
  Goal,
  MonthlyReport,
  NotificationItem,
  RetrospectCandidate,
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
  input: { name: string; targetAmount: number; currentAmount?: number },
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

export async function getRetrospectCandidates(limit: number) {
  const response = await httpClient.get<{ candidates: RetrospectCandidate[] }>(
    '/retrospects/candidates',
    { params: { limit } },
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
