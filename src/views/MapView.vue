<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  IconBulb,
  IconChevronDown,
  IconMessage2,
  IconMoodSmile,
  IconMoonStars,
  IconPencil,
  IconReceipt2,
  IconStar,
} from '@tabler/icons-vue'

import type { SatisfactionMap, SatisfactionMapPoint } from '@/api/types'
import AppBottomNav from '@/components/common/AppBottomNav.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppTopBar from '@/components/common/AppTopBar.vue'
import MerchantBadge from '@/components/common/MerchantBadge.vue'
import PrimaryButton from '@/components/common/PrimaryButton.vue'
import SatisfactionScatter from '@/components/map/SatisfactionScatter.vue'
import {
  PRESCRIPTION_LABEL,
  VERDICT_BADGE,
  VERDICT_DOT_CLASS,
  VERDICT_SOFT_BG_CLASS,
  VERDICT_TEXT_CLASS,
  verdictTone,
} from '@/components/map/verdictStyle'
import { useMapStore } from '@/stores/map'

const route = useRoute()
const mapStore = useMapStore()
const subview = ref<'map' | 'behavior' | 'transactions'>('map')

/** 서버 연동 전 임시 데이터. `GET /satisfaction-map` 응답과 같은 모양이다. */
const mockMap: SatisfactionMap = {
  analysisYearMonth: '2025-05',
  axisX: { label: '지출 부담', formula: 'MONTHLY_TOTAL_OVER_BUDGET', monthlyBudget: 2_500_000 },
  axisY: { label: '만족도', range: [-1, 1] },
  boundaries: { x: 0.04, y: 0 },
  points: [
    {
      behaviorId: 1,
      name: '여행',
      monthlyTotalAmount: 75_000,
      avgAmount: 25_000,
      txCount: 3,
      burdenRatio: 0.03,
      adjustedSatisfaction: 0.85,
      retrospectCount: 3,
      evaluationStatus: 'RESOLVED',
      quadrant: 'PROTECT',
      verdict: 'SUSTAIN',
      prescription: '만족도가 높고 부담이 낮아요. 지금처럼 유지해도 좋아요.',
      cta: { type: 'RESERVE_BUDGET', label: '예산 확보하기' },
    },
    {
      behaviorId: 2,
      name: '친구와 외식',
      monthlyTotalAmount: 190_000,
      avgAmount: 47_500,
      txCount: 4,
      burdenRatio: 0.076,
      adjustedSatisfaction: 0.62,
      retrospectCount: 4,
      evaluationStatus: 'RESOLVED',
      quadrant: 'KEEP',
      verdict: 'SUSTAIN',
      prescription: '만족도는 높지만 지출 부담이 커요. 횟수보다 금액을 살펴보세요.',
      cta: null,
    },
    {
      behaviorId: 3,
      name: '친구와 카페',
      monthlyTotalAmount: 120_000,
      avgAmount: 20_000,
      txCount: 6,
      burdenRatio: 0.048,
      adjustedSatisfaction: 0.4,
      retrospectCount: 5,
      evaluationStatus: 'RESOLVED',
      quadrant: 'KEEP',
      verdict: 'SUSTAIN',
      prescription: '관계에 쓰는 지출이라 만족도가 높아요. 주 1회 정도가 적당해요.',
      cta: null,
    },
    {
      behaviorId: 4,
      name: '대중교통',
      monthlyTotalAmount: 60_000,
      avgAmount: 12_000,
      txCount: 5,
      burdenRatio: 0.024,
      adjustedSatisfaction: -0.3,
      retrospectCount: 3,
      evaluationStatus: 'RESOLVED',
      quadrant: 'MINOR',
      verdict: 'ADJUST',
      prescription: '부담은 작지만 만족도가 낮아요. 정기권을 검토해보세요.',
      cta: null,
    },
    {
      behaviorId: 5,
      name: '온라인 쇼핑',
      monthlyTotalAmount: 90_000,
      avgAmount: 30_000,
      txCount: 3,
      burdenRatio: 0.036,
      adjustedSatisfaction: -0.12,
      retrospectCount: 1,
      evaluationStatus: 'PENDING',
      quadrant: null,
      verdict: null,
      prescription: '회고가 더 쌓이면 판정을 알려드릴게요.',
      cta: null,
    },
    {
      behaviorId: 6,
      name: '심야 배달',
      monthlyTotalAmount: 108_500,
      avgAmount: 21_700,
      txCount: 5,
      burdenRatio: 0.0434,
      adjustedSatisfaction: -0.72,
      retrospectCount: 5,
      evaluationStatus: 'RESOLVED',
      quadrant: 'PRIORITY',
      verdict: 'ADJUST',
      prescription: '늦은 시간 배달 지출이 반복되고 있어요. 소액이라도 누적 부담이 커질 수 있어요.',
      cta: null,
    },
    {
      behaviorId: 7,
      name: '택시',
      monthlyTotalAmount: 140_000,
      avgAmount: 35_000,
      txCount: 4,
      burdenRatio: 0.056,
      adjustedSatisfaction: -0.45,
      retrospectCount: 4,
      evaluationStatus: 'RESOLVED',
      quadrant: 'PRIORITY',
      verdict: 'ADJUST',
      prescription: '심야 이동이 잦아요. 막차 시간을 미리 확인해보세요.',
      cta: null,
    },
  ],
}

const selectedId = ref<number | null>(6)
const filter = ref<string>('전체')

onMounted(() => {
  mapStore.data = mockMap
  const behavior = route.query.behavior
  if (typeof behavior === 'string') {
    const match = mockMap.points.find((p) => p.name === behavior)
    if (match) {
      selectedId.value = match.behaviorId
      subview.value = 'behavior'
    }
  }
})

const points = computed(() => mapStore.sortedPoints)
const visiblePoints = computed(() =>
  filter.value === '전체' ? points.value : points.value.filter((p) => p.name === filter.value),
)
const selected = computed<SatisfactionMapPoint | null>(
  () => points.value.find((p) => p.behaviorId === selectedId.value) ?? null,
)

/** -1~+1 축을 회고 화면과 같은 5점 척도로 환산한다. */
const satisfactionScore = computed(() =>
  selected.value ? ((selected.value.adjustedSatisfaction + 1) / 2) * 4 + 1 : 0,
)

const selectedTone = computed(() => (selected.value ? verdictTone(selected.value) : 'pending'))

/** FR-07-04 처방 문구 5종. quadrant 코드 자체는 화면에 내지 않는다 (FR-06-03). */
const prescriptionLabel = computed(() =>
  selected.value?.quadrant === undefined || selected.value?.quadrant === null
    ? PRESCRIPTION_LABEL.PENDING
    : PRESCRIPTION_LABEL[selected.value.quadrant],
)

const burdenLabel = computed(() => {
  const boundary = mockMap.boundaries.x
  if (selected.value === null || boundary === null) return '보통'
  return selected.value.burdenRatio >= boundary ? '높음' : '낮음'
})

const explicitTransactions: Record<
  string,
  { merchant: string; amount: number; at: string; score: number }[]
> = {
  '심야 배달': [
    { merchant: '배달의민족', amount: 23_000, at: '2025.05.13 23:41', score: 2 },
    { merchant: '요기요', amount: 19_500, at: '2025.05.10 00:12', score: 2 },
    { merchant: '쿠팡이츠', amount: 24_000, at: '2025.05.07 03:58', score: 3 },
    { merchant: 'BBQ', amount: 22_000, at: '2025.04.28 00:35', score: 2 },
    { merchant: '교촌치킨', amount: 20_000, at: '2025.04.14 01:12', score: 2 },
  ],
}

const transactions = computed(() => {
  const point = selected.value
  if (!point) return []
  const explicit = explicitTransactions[point.name]
  if (explicit) return explicit.slice(0, point.txCount)
  return Array.from({ length: point.txCount }, (_, i) => ({
    merchant: point.name,
    amount: point.avgAmount,
    at: `2025.05.${String(20 - i * 3).padStart(2, '0')} 19:${String(10 + i * 7).padStart(2, '0')}`,
    score: Math.max(1, Math.round(satisfactionScore.value)),
  }))
})

function selectPoint(behaviorId: number) {
  selectedId.value = behaviorId
}
</script>

<template>
  <div class="flex h-full flex-col">
    <AppTopBar
      v-if="subview === 'map'"
      title="나의 만족도 지도"
      bell
    />
    <AppTopBar
      v-else
      :back-handler="() => (subview = subview === 'transactions' ? 'behavior' : 'map')"
    />

    <main class="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
      <template v-if="subview === 'map'">
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full border px-3 py-1.5 text-xs font-medium"
            :class="
              filter === '전체'
                ? 'border-brand bg-brand text-surface'
                : 'border-line text-ink-muted'
            "
            @click="filter = '전체'"
          >
            전체
          </button>
          <button
            v-for="p in points"
            :key="p.behaviorId"
            type="button"
            class="rounded-full border px-3 py-1.5 text-xs font-medium"
            :class="filter === p.name ? 'border-brand text-brand' : 'border-line text-ink-muted'"
            @click="((filter = p.name), selectPoint(p.behaviorId))"
          >
            {{ p.name }}
          </button>
        </div>

        <div class="border-line relative rounded-2xl border p-3">
          <div
            class="text-ink-muted pointer-events-none absolute top-5 right-6 left-9 flex justify-between text-xs font-bold"
          >
            <span class="text-verdict-sustain">{{ PRESCRIPTION_LABEL.PROTECT }}</span>
            <span class="text-verdict-sustain">{{ PRESCRIPTION_LABEL.KEEP }}</span>
          </div>
          <div
            class="text-ink-muted pointer-events-none absolute right-6 bottom-11 left-9 flex justify-between text-xs font-bold"
          >
            <span class="text-verdict-adjust">{{ PRESCRIPTION_LABEL.MINOR }}</span>
            <span class="text-verdict-adjust">{{ PRESCRIPTION_LABEL.PRIORITY }}</span>
          </div>

          <div class="flex">
            <div
              class="text-ink-muted flex w-4 shrink-0 flex-col items-center justify-between py-2 text-[11px]"
            >
              <span>높음</span>
              <span class="[writing-mode:vertical-rl] font-medium">{{ mockMap.axisY.label }}</span>
              <span>낮음</span>
            </div>
            <SatisfactionScatter
              class="min-w-0 flex-1"
              :points="visiblePoints"
              :boundaries="mockMap.boundaries"
              :selected-id="selectedId"
              @select="selectPoint"
            />
          </div>

          <div class="text-ink-muted mt-1 flex items-center justify-between pl-4 text-[11px]">
            <span>낮음</span>
            <span class="font-medium">{{ mockMap.axisX.label }}</span>
            <span>높음</span>
          </div>
        </div>

        <AppCard v-if="selected">
          <div class="flex items-center gap-2">
            <span
              class="size-3 shrink-0 rounded-full"
              :class="VERDICT_DOT_CLASS[selectedTone]"
            ></span>
            <p class="text-ink font-bold">{{ selected.name }}({{ selected.retrospectCount }})</p>
            <span
              v-if="VERDICT_BADGE[selectedTone]"
              class="rounded-full px-2 py-0.5 text-xs font-semibold"
              :class="[VERDICT_TEXT_CLASS[selectedTone], VERDICT_SOFT_BG_CLASS[selectedTone]]"
            >
              {{ VERDICT_BADGE[selectedTone] }}
            </span>
          </div>

          <p
            class="mt-1 text-sm font-bold"
            :class="VERDICT_TEXT_CLASS[selectedTone]"
          >
            {{ prescriptionLabel }}
          </p>

          <div
            class="divide-line border-line mt-3 grid grid-cols-3 divide-x rounded-xl border py-2 text-center"
          >
            <div>
              <p class="text-ink-muted text-[11px]">평균 결제금액</p>
              <p class="text-ink mt-0.5 text-sm font-bold">
                {{ selected.avgAmount.toLocaleString('ko-KR') }}원
              </p>
            </div>
            <div>
              <p class="text-ink-muted text-[11px]">최근 건수</p>
              <p class="text-ink mt-0.5 text-sm font-bold">{{ selected.txCount }}건</p>
            </div>
            <div>
              <p class="text-ink-muted text-[11px]">상태</p>
              <p class="text-ink mt-0.5 text-sm font-bold">
                {{ selected.evaluationStatus === 'PENDING' ? '보류' : '완료' }}
              </p>
            </div>
          </div>

          <p class="text-ink-muted mt-3 flex gap-1.5 text-xs leading-relaxed">
            <IconBulb
              :size="15"
              class="text-brand mt-0.5 shrink-0"
            />
            {{ selected.prescription }}
          </p>

          <div class="divide-line mt-2 divide-y">
            <div
              v-for="tx in transactions.slice(0, 3)"
              :key="tx.at"
              class="flex items-center gap-3 py-2.5"
            >
              <MerchantBadge
                :name="tx.merchant"
                size="sm"
              />
              <span class="flex-1">
                <span class="text-ink block text-sm font-semibold">{{ tx.merchant }}</span>
                <span class="text-ink-muted block text-xs">{{ tx.at }}</span>
              </span>
              <span class="text-ink text-sm font-bold"
                >{{ tx.amount.toLocaleString('ko-KR') }}원</span
              >
            </div>
          </div>

          <button
            type="button"
            class="text-ink-muted mt-2 flex w-full items-center justify-center gap-1 text-xs"
            @click="subview = 'behavior'"
          >
            더 보기 <IconChevronDown :size="14" />
          </button>
        </AppCard>
      </template>

      <template v-else-if="subview === 'behavior' && selected">
        <div class="flex items-center gap-3">
          <span
            class="flex size-14 shrink-0 items-center justify-center rounded-full"
            :class="VERDICT_SOFT_BG_CLASS[selectedTone]"
          >
            <IconMoonStars
              :size="26"
              :stroke-width="1.5"
              :class="VERDICT_TEXT_CLASS[selectedTone]"
            />
          </span>
          <div>
            <p class="text-ink text-lg font-bold">{{ selected.name }}</p>
            <p class="text-ink-muted text-sm">최근 30일 기준 소비 행동이에요</p>
          </div>
        </div>

        <div class="flex gap-2">
          <span class="bg-surface-muted text-ink-muted rounded-full px-3 py-1 text-xs font-medium">
            만족도 {{ selected.adjustedSatisfaction >= 0 ? '높음' : '낮음' }}
          </span>
          <span class="bg-surface-muted text-ink-muted rounded-full px-3 py-1 text-xs font-medium">
            지출 부담 {{ burdenLabel }}
          </span>
        </div>

        <div>
          <p class="text-ink mb-2 text-sm font-semibold">핵심 지표</p>
          <div class="grid grid-cols-2 gap-3">
            <AppCard>
              <p class="text-ink-muted flex items-center gap-1 text-xs">
                <IconReceipt2 :size="14" /> 총 지출 금액
              </p>
              <p class="text-ink mt-1 text-xl font-extrabold">
                {{ selected.monthlyTotalAmount.toLocaleString('ko-KR') }}원
              </p>
              <p class="text-ink-muted text-[11px]">최근 30일</p>
            </AppCard>
            <AppCard>
              <p class="text-ink-muted flex items-center gap-1 text-xs">
                <IconPencil :size="14" /> 이용 횟수
              </p>
              <p class="text-ink mt-1 text-xl font-extrabold">{{ selected.txCount }}회</p>
              <p class="text-ink-muted text-[11px]">최근 30일</p>
            </AppCard>
            <AppCard>
              <p class="text-ink-muted flex items-center gap-1 text-xs">
                <IconStar :size="14" /> 평균 만족도
              </p>
              <p class="text-ink mt-1 text-xl font-extrabold">
                {{ satisfactionScore.toFixed(1) }}<span class="text-sm">/5</span>
              </p>
              <p class="text-ink-muted text-[11px]">최근 30일</p>
            </AppCard>
            <AppCard>
              <p class="text-ink-muted flex items-center gap-1 text-xs">
                <IconMessage2 :size="14" /> 회고 건수
              </p>
              <p class="text-ink mt-1 text-xl font-extrabold">{{ selected.retrospectCount }}건</p>
              <p class="text-ink-muted text-[11px]">최근 30일</p>
            </AppCard>
          </div>
        </div>

        <div class="bg-brand/5 rounded-2xl p-4">
          <p class="text-brand flex items-center gap-1.5 text-sm font-semibold">
            <IconBulb :size="15" /> AI 인사이트
          </p>
          <p class="text-ink mt-2 text-sm leading-relaxed">{{ selected.prescription }}</p>
        </div>

        <div class="space-y-2">
          <PrimaryButton
            v-if="selected.cta"
            @click="$router.push('/chat')"
            >{{ selected.cta.label }}</PrimaryButton
          >
          <PrimaryButton
            variant="outline"
            @click="subview = 'transactions'"
            >거래 내역 보기</PrimaryButton
          >
        </div>
      </template>

      <template v-else-if="selected">
        <div class="flex items-center gap-3">
          <span
            class="flex size-12 shrink-0 items-center justify-center rounded-full"
            :class="VERDICT_SOFT_BG_CLASS[selectedTone]"
          >
            <IconMoonStars
              :size="22"
              :stroke-width="1.5"
              :class="VERDICT_TEXT_CLASS[selectedTone]"
            />
          </span>
          <div>
            <p class="text-ink font-bold">{{ selected.name }}</p>
            <p class="text-ink-muted text-xs">회고가 완료된 거래를 모았어요</p>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-ink text-sm font-semibold">
            거래 내역
            <span class="text-ink-muted font-normal">(총 {{ transactions.length }}건)</span>
          </p>
          <p class="text-ink text-sm font-bold">
            총 {{ transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString('ko-KR') }}원
          </p>
        </div>

        <div class="space-y-2">
          <div
            v-for="tx in transactions"
            :key="tx.at"
            class="border-line flex items-center gap-3 rounded-2xl border p-3"
          >
            <MerchantBadge :name="tx.merchant" />
            <span class="flex-1">
              <span class="text-ink block text-sm font-semibold">{{ tx.merchant }}</span>
              <span class="text-ink-muted block text-xs">{{ tx.at }}</span>
            </span>
            <span class="text-right">
              <span class="text-ink block text-sm font-bold"
                >{{ tx.amount.toLocaleString('ko-KR') }}원</span
              >
              <span
                class="text-satisfaction-low bg-satisfaction-low/10 mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
              >
                {{ tx.score }}/5
              </span>
            </span>
          </div>
        </div>

        <p class="text-ink-muted bg-surface-muted flex items-center gap-2 rounded-2xl p-3 text-xs">
          <IconMoodSmile
            :size="16"
            class="shrink-0"
          />
          회고가 완료된 거래만 표시됩니다. 회고가 아직이라면 AI채팅에서 이어서 작성할 수 있어요.
        </p>
      </template>
    </main>

    <AppBottomNav />
  </div>
</template>
