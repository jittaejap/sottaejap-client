import type { SatisfactionMapPoint } from '@/api/types'

/**
 * 07 §8 · E-11 — 만족도 지도의 색 규칙은 여기 한 곳에만 둔다.
 * 색은 verdict 2색뿐이고, 보류(PENDING)는 색이 아니라 회색 반투명으로만 구분한다.
 * 처방 문구(Awesome!!/Hmm!)는 색을 정하는 데 쓰지 않는다.
 */
export type VerdictTone = 'sustain' | 'adjust' | 'pending'

export function verdictTone(point: SatisfactionMapPoint): VerdictTone {
  if (point.evaluationStatus === 'PENDING') return 'pending'
  return point.verdict === 'SUSTAIN' ? 'sustain' : 'adjust'
}

/** echarts는 색을 문자열로 받으므로 토큰 이름을 넘겨 런타임에 읽게 한다. */
export const VERDICT_COLOR_VAR: Record<VerdictTone, string> = {
  sustain: '--color-verdict-sustain',
  adjust: '--color-verdict-adjust',
  pending: '--color-verdict-pending',
}

/** 보류 점은 반투명하게 찍는다. */
export const VERDICT_OPACITY: Record<VerdictTone, number> = {
  sustain: 1,
  adjust: 1,
  pending: 0.45,
}

export const VERDICT_DOT_CLASS: Record<VerdictTone, string> = {
  sustain: 'bg-verdict-sustain',
  adjust: 'bg-verdict-adjust',
  pending: 'bg-verdict-pending/50',
}

export const VERDICT_TEXT_CLASS: Record<VerdictTone, string> = {
  sustain: 'text-verdict-sustain',
  adjust: 'text-verdict-adjust',
  pending: 'text-verdict-pending',
}

export const VERDICT_SOFT_BG_CLASS: Record<VerdictTone, string> = {
  sustain: 'bg-verdict-sustain/10',
  adjust: 'bg-verdict-adjust/10',
  pending: 'bg-verdict-pending/10',
}

/** FR-07-02 · 05 §0 클라이언트 분기 규칙 — 보류에는 배지를 달지 않는다. */
export const VERDICT_BADGE: Record<VerdictTone, string | null> = {
  sustain: '지켜요',
  adjust: '바꿔볼까요',
  pending: null,
}

/**
 * FR-07-04 처방 문구 5종. 'Out'은 E-5·NFR-09로 폐기됐으므로 쓰지 않는다.
 * 문구는 표시용일 뿐이고 색을 정하는 데 쓰지 않는다 (FR-07-02).
 */
export const PRESCRIPTION_LABEL = {
  PROTECT: 'Awesome!!',
  KEEP: 'Great!',
  MINOR: 'Umm...',
  PRIORITY: 'Hmm!',
  PENDING: '아직 판단하기 일러요',
} as const
