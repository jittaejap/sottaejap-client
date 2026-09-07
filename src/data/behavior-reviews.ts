import type { Satisfaction } from '@/api/enums'

export interface BehaviorReview {
  behavior: string
  merchant: string
  amount: number
  at: string
  purpose: string
  satisfaction: Satisfaction
}

export const behaviorReviews: readonly BehaviorReview[] = [
  {
    behavior: '심야 배달',
    merchant: '요기요',
    amount: 24_000,
    at: '2025.05.18 23:45',
    purpose: '배고파서 충동적으로 주문',
    satisfaction: 'LOW',
  },
  {
    behavior: '심야 배달',
    merchant: '배달의민족',
    amount: 22_000,
    at: '2025.05.12 00:10',
    purpose: '피곤한 하루 보상 심리',
    satisfaction: 'LOW',
  },
  {
    behavior: '심야 배달',
    merchant: '쿠팡이츠',
    amount: 24_000,
    at: '2025.05.05 22:30',
    purpose: '친구와 함께 야식 파티',
    satisfaction: 'HIGH',
  },
  {
    behavior: '심야 배달',
    merchant: 'BBQ 치킨',
    amount: 22_000,
    at: '2025.04.28 23:15',
    purpose: '스트레스 해소용 주문',
    satisfaction: 'LOW',
  },
  {
    behavior: '심야 배달',
    merchant: '요기요',
    amount: 0,
    at: '2025.04.15 22:00',
    purpose: '포인트 전액 결제',
    satisfaction: 'UNKNOWN',
  },
]

export function reviewsForBehavior(behavior: string) {
  return behaviorReviews.filter((review) => review.behavior === behavior)
}
