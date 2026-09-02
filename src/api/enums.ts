/**
 * 05 §0 공통 enum — 세 레포가 같은 문자열을 쓴다 (07 §6).
 * 값을 바꾸려면 05 문서를 먼저 고치고 팀 채널에 [계약변경] 공지한다.
 */
export const SATISFACTION = ['HIGH', 'LOW', 'UNKNOWN'] as const
export type Satisfaction = (typeof SATISFACTION)[number]

export const TIME_SLOT = ['MORNING', 'AFTERNOON', 'NIGHT'] as const
export type TimeSlot = (typeof TIME_SLOT)[number]

export const CARD_ISSUER = ['KB', 'HANA', 'SHINHAN'] as const
export type CardIssuer = (typeof CARD_ISSUER)[number]

export const RETROSPECT_STATUS = ['ACTIVE', 'PAUSED', 'COMPLETED'] as const
export type RetrospectStatus = (typeof RETROSPECT_STATUS)[number]

/** 좌표. 보류 시 null */
export const QUADRANT = ['PROTECT', 'KEEP', 'MINOR', 'PRIORITY'] as const
export type Quadrant = (typeof QUADRANT)[number]

/** 처방 2색. 보류 시 null — 보류는 evaluationStatus로 표현한다 (E-11) */
export const VERDICT = ['SUSTAIN', 'ADJUST'] as const
export type Verdict = (typeof VERDICT)[number]

export const EVALUATION_STATUS = ['RESOLVED', 'PENDING'] as const
export type EvaluationStatus = (typeof EVALUATION_STATUS)[number]

export const NOTIFICATION_TYPE = ['RETROSPECT_DUE', 'SUGGESTION'] as const
export type NotificationType = (typeof NOTIFICATION_TYPE)[number]

export const AUTH_PROVIDER = ['LOCAL', 'KAKAO', 'NAVER', 'GOOGLE'] as const
export type AuthProvider = (typeof AUTH_PROVIDER)[number]

export const REASON_CODE = [
  'TIMESLOT_OUTLIER',
  'THRESHOLD_EXCEEDED',
  'REPEATED_LOW_SATISFACTION',
  'ONBOARDING_SAMPLE',
  'MANUAL_PICK',
] as const
export type ReasonCode = (typeof REASON_CODE)[number]
