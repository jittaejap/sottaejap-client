import type {
  AuthProvider,
  CompanionTag,
  EvaluationStatus,
  NotificationType,
  PurposeTag,
  Quadrant,
  ReasonCode,
  ReflectionStep,
  Satisfaction,
  SuggestionStatus,
  TimeSlot,
  Verdict,
} from '@/api/enums'

/** `GET /users/me` (05 §1 #2) */
export interface UserMe {
  id: number
  email: string | null
  nickname: string | null
  authProvider: AuthProvider
  monthlyBudget: number
  outlierThreshold: number
  retrospectDelayDays: number
  onboardingCompleted: boolean
  /** `YYYY-MM` */
  analysisYearMonth: string | null
}

export interface TransactionUploadResult {
  importedCount: number
  skippedCount: number
  periodFrom: string
  periodTo: string
  skippedRows: { row: number; reason: string }[]
}

export interface Transaction {
  id: number
  occurredAt: string
  merchant: string
  amount: number
  category: string
  retrospectId: number | null
  satisfaction: 'HIGH' | 'LOW' | 'UNKNOWN' | null
}

export interface TransactionPage {
  transactions: Transaction[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface Goal {
  id: number
  name: string
  targetAmount: number
  currentAmount: number
  adoptedSaving: number
  achievementRate: number | null
  projectedRate: number | null
}

export interface RetrospectCandidate {
  transactionId: number
  occurredAt: string
  merchant: string
  amount: number
  category: string
  timeSlot: TimeSlot
  reasonCode: ReasonCode
  reason: string
}

export interface Suggestion {
  id: number
  behaviorId: number
  behaviorName: string
  monthlyTotalAmount: number
  avgAmount: number
  txCount: number
  adjustedSatisfaction: number
  quadrant: Quadrant | null
  adjustCount: number
  expectedSaving: number
  goalId: number | null
  status: SuggestionStatus
  reason: string
}

export interface Analysis {
  analysisYearMonth: string | null
  byVerdict: {
    verdict: Verdict
    clusterCount: number
    monthlyTotalAmount: number
    share: number | null
  }[]
  pending: { clusterCount: number; monthlyTotalAmount: number; share: number | null }
  byCategory: {
    category: string
    dominantTimeSlot: TimeSlot | null
    avgAmount: number | null
    monthlyTotalAmount: number
    verdict: Verdict | null
  }[]
  highlight: string
}

export interface NotificationItem {
  id: number
  type: NotificationType
  refId: number
  message: string
  isRead: boolean
  createdAt: string
}

export interface MonthlyReport {
  yearMonth: string
  finalized: boolean
  totalSpending: number
  previousTotalSpending: number | null
  savedAmount: number | null
  unsatisfiedCount: number
  repeatCount: number
  previousRepeatCount: number | null
  goalAllocations: { goalId: number; amount: number }[]
}

export interface BehaviorSummary {
  behaviorId: number
  name: string
  clusterKey: string
  parentId: number | null
  monthlyTotalAmount: number
  avgAmount: number
  txCount: number
  retrospectCount: number
  burdenRatio: number
  adjustedSatisfaction: number
  evaluationStatus: EvaluationStatus
  quadrant: Quadrant | null
  verdict: Verdict | null
}

export interface BehaviorTransaction {
  id: number
  occurredAt: string
  merchant: string
  amount: number
  category: string
  timeSlot: TimeSlot
  behaviorId: number
}

export interface BehaviorDetail {
  behavior: BehaviorSummary
  transactions: BehaviorTransaction[]
}

/** `GET /satisfaction-map` (05 §1 #14) — 렌더링 계약은 07 §8 */
export interface SatisfactionMapPoint {
  behaviorId: number
  name: string
  monthlyTotalAmount: number
  avgAmount: number
  txCount: number
  /** 월 합계 ÷ 월 예산 */
  burdenRatio: number
  /** -1 ~ +1 */
  adjustedSatisfaction: number
  retrospectCount: number
  evaluationStatus: EvaluationStatus
  /** 보류(PENDING)면 null */
  quadrant: Quadrant | null
  /** 보류(PENDING)면 null */
  verdict: Verdict | null
  prescription: string
  cta: { type: 'RESERVE_BUDGET'; label: string } | null
}

export interface SatisfactionMap {
  analysisYearMonth: string
  axisX: { label: string; formula: 'MONTHLY_TOTAL_OVER_BUDGET'; monthlyBudget: number }
  axisY: { label: string; range: [number, number] }
  /** 미결 #18 — null이면 축 경계선을 그리지 않는다 */
  boundaries: { x: number | null; y: number | null }
  points: SatisfactionMapPoint[]
}

/**
 * `POST /retrospects/chat` (05 §2 #11 · 01 E-63) — 지금까지 **사용자가 확인한** 값이다.
 * AI 후보값은 칩을 미리 눌러 두는 데만 쓰고, 사용자가 확정해야 여기에 실린다 (E-20 · FR-04-07).
 * `satisfaction`의 미확정 표기는 05 요청 예시대로 `UNKNOWN`이다 — 서버는 이 값을 보고 다음 단계를 정한다.
 */
export interface RetrospectReflection {
  satisfaction: Satisfaction
  purpose: PurposeTag | null
  companion: CompanionTag | null
  repeatIntent: boolean | null
}

/**
 * `recentMessages` 한 건 (01 E-87 · E-109 · E-110).
 * 오름차순으로 싣고 마지막 6건만 보낸다. `content`는 공백이 아니어야 하고
 * `user` 500자 · `assistant` 2,000자를 넘으면 400 `INVALID_INPUT`이다.
 */
export interface RetrospectChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface RetrospectChatResult {
  reply: string
  step: ReflectionStep
  reflection: RetrospectReflection
  needsClarification: boolean
  uncertainFields: string[]
  fallback: boolean
}
