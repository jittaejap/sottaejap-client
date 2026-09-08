import type { Satisfaction } from '@/api/enums'
import { httpClient } from '@/api/httpClient'
import type { BehaviorDetail, TransactionUploadResult, UserMe } from '@/api/types'

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
  const response = await httpClient.post('/goals', input)
  return response.data
}

export async function uploadTransactions(file: File) {
  const form = new FormData()
  form.append('file', file)
  const response = await httpClient.post<TransactionUploadResult>('/transactions/upload', form)
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
  const response = await httpClient.post('/onboarding/start', input)
  return response.data
}

export async function getRetrospectCandidates(limit: number) {
  const response = await httpClient.get<{
    candidates: {
      transactionId: number
      occurredAt: string
      merchant: string
      amount: number
      category: string
      timeSlot: string
      reasonCode: string
      reason: string
    }[]
  }>('/retrospects/candidates', { params: { limit } })
  return response.data.candidates
}

export async function saveRetrospect(input: {
  transactionId: number
  satisfaction: Satisfaction
  purpose: string
  companion: string
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
