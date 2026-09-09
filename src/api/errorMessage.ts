import { ApiError } from '@/api/apiError'

/** 화면별 기본 문구를 유지하면서 공통 API 오류 코드는 계약에 맞게 구분한다. */
export function apiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback
  switch (error.code) {
    case 'UNAUTHORIZED':
      return '로그인이 만료됐어요. 다시 로그인해 주세요.'
    case 'ONBOARDING_REQUIRED':
      return '먼저 온보딩을 완료해 주세요.'
    case 'INVALID_INPUT':
      return '입력값을 확인해 주세요. 같은 요청을 반복해도 처리되지 않아요.'
    case 'LLM_UNAVAILABLE':
      return 'AI 연결이 원활하지 않아 지금은 기본 안내 모드로 전환했어요.'
    default:
      return fallback
  }
}
