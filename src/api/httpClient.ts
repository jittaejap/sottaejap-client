import axios, { AxiosError, type AxiosResponse } from 'axios'

import { ApiError } from '@/api/apiError'

/** 05 §0 응답 봉투 */
type ApiEnvelope<T> =
  { success: true; data: T } | { success: false; error: { code: string; message: string } }

let accessToken: string | null = null

/** 로그인·로그아웃 시 user store가 호출한다. 데모 단일 계정이면 null로 두어 헤더를 생략한다. */
export function setAccessToken(token: string | null) {
  accessToken = token
}

/**
 * 모든 요청은 이 인스턴스로 보낸다. 봉투 해제와 오류 정규화를 여기서 끝내므로
 * 호출부는 `data`만 받고 `ApiError`만 잡는다.
 */
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 20_000,
})

httpClient.interceptors.request.use((config) => {
  if (accessToken !== null) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

httpClient.interceptors.response.use(
  (response: AxiosResponse<ApiEnvelope<unknown>>) => {
    const body = response.data
    if (body.success) {
      return { ...response, data: body.data }
    }
    throw new ApiError(body.error.code, response.status, body.error.message)
  },
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const body = error.response?.data
    if (body !== undefined && !body.success) {
      throw new ApiError(body.error.code, error.response?.status ?? 0, body.error.message)
    }
    throw new ApiError('NETWORK', error.response?.status ?? 0, error.message)
  },
)
