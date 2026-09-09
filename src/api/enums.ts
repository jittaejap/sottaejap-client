/**
 * 05 §0 공통 enum — 세 레포가 같은 문자열을 쓴다 (07 §6).
 * 값을 바꾸려면 05 문서를 먼저 고치고 팀 채널에 [계약변경] 공지한다.
 */
export const SATISFACTION = ['HIGH', 'LOW', 'UNKNOWN'] as const
export type Satisfaction = (typeof SATISFACTION)[number]

export const TIME_SLOT = ['MORNING', 'DAY', 'EVENING', 'NIGHT'] as const
export type TimeSlot = (typeof TIME_SLOT)[number]

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

export const SUGGESTION_STATUS = ['PROPOSED', 'ADOPTED', 'REJECTED'] as const
export type SuggestionStatus = (typeof SUGGESTION_STATUS)[number]

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

/** 표준 태그 7/6종 (01 E-20 · E-41). 저장값·응답값은 이 표기 하나다 — 가운뎃점(U+00B7) 둘레에 공백이 없다. */
export const PURPOSE_TAG = [
  '식사',
  '만남·사교',
  '휴식·취미',
  '필수품',
  '자기계발',
  '충동',
  '기타',
] as const
export type PurposeTag = (typeof PURPOSE_TAG)[number]

export const COMPANION_TAG = ['혼자', '친구', '가족', '연인', '동료', '기타'] as const
export type CompanionTag = (typeof COMPANION_TAG)[number]

/**
 * 회고 대화 단계 (05 §0 `reflectionStep` · 01 E-69).
 * **화면이 소유한다** — 지금 어떤 질문을 띄웠는지는 클라이언트가 안다.
 * `INTRO`는 사용자 입력이 없는 턴이라 `message`를 생략한다.
 */
export const REFLECTION_STEP = [
  'INTRO',
  'SATISFACTION',
  'PURPOSE',
  'COMPANION',
  'REPEAT',
  'CONFIRM',
] as const
export type ReflectionStep = (typeof REFLECTION_STEP)[number]
