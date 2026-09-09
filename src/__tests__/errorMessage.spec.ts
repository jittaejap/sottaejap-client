import { describe, expect, it } from 'vitest'

import { ApiError } from '@/api/apiError'
import { apiErrorMessage } from '@/api/errorMessage'

const fallback = '거래내역을 업로드하지 못했어요. 파일을 확인하고 다시 시도해주세요.'
const tooManyRows = '거래내역이 너무 많아요. 20,000건 이하로 나눠서 올려 주세요.'

describe('apiErrorMessage', () => {
  it('TOO_MANY_ROWS는 서버 message를 그대로 돌려준다 (05 §2)', () => {
    expect(apiErrorMessage(new ApiError('TOO_MANY_ROWS', 400, tooManyRows), fallback)).toBe(
      tooManyRows,
    )
  })

  it('다른 오류 코드의 기존 문구는 바뀌지 않는다', () => {
    expect(apiErrorMessage(new ApiError('UNAUTHORIZED', 401, '서버 문구'), fallback)).toBe(
      '로그인이 만료됐어요. 다시 로그인해 주세요.',
    )
    expect(apiErrorMessage(new ApiError('ONBOARDING_REQUIRED', 403, '서버 문구'), fallback)).toBe(
      '먼저 온보딩을 완료해 주세요.',
    )
    expect(apiErrorMessage(new ApiError('INVALID_INPUT', 400, '서버 문구'), fallback)).toBe(
      '입력값을 확인해 주세요. 같은 요청을 반복해도 처리되지 않아요.',
    )
    expect(apiErrorMessage(new ApiError('LLM_UNAVAILABLE', 503, '서버 문구'), fallback)).toBe(
      'AI 연결이 원활하지 않아 지금은 기본 안내 모드로 전환했어요.',
    )
  })

  it('모르는 코드와 ApiError가 아닌 예외는 fallback을 돌려준다', () => {
    expect(apiErrorMessage(new ApiError('INTERNAL_ERROR', 500, '서버 문구'), fallback)).toBe(
      fallback,
    )
    expect(apiErrorMessage(new ApiError('NETWORK', 0, 'Network Error'), fallback)).toBe(fallback)
    expect(apiErrorMessage(new Error('boom'), fallback)).toBe(fallback)
  })
})
