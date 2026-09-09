<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconBell,
  IconBurger,
  IconChevronRight,
  IconCoffee,
  IconCar,
  IconMoped,
  IconCrown,
  IconMoodAnnoyed,
  IconMoodX,
  IconSettings,
  IconSparkles,
  IconThumbUp,
} from '@tabler/icons-vue'

import AppBottomNav from '@/components/common/AppBottomNav.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppTopBar from '@/components/common/AppTopBar.vue'
import WeeklyTrendChart from '@/components/common/WeeklyTrendChart.vue'
import { PRESCRIPTION_LABEL } from '@/components/map/verdictStyle'
import goalTravelImage from '@/assets/images/onboarding/goal-travel.png'
import aiBriefingImage from '@/assets/images/ai/04_happy_cheeks_hat.png'
import savingsImage from '@/assets/images/savings-summary.png'
import { useMapStore } from '@/stores/map'
import {
  getAnalysis,
  getGoals,
  getMonthlyReport,
  getNotifications,
  getSuggestions,
} from '@/api/service'
import type { Goal, MonthlyReport, Suggestion } from '@/api/types'

const router = useRouter()
const mapStore = useMapStore()
const subview = ref<'dashboard' | 'goal' | 'savings'>('dashboard')

const serverGoal = ref<Goal | null>(null)
const monthlyReport = ref<MonthlyReport | null>(null)
const adoptedSuggestions = ref<Suggestion[]>([])
const unreadCount = ref(0)
/** `GET /analysis`의 `highlight` (FR-11-03 · E-75). 못 받으면 카드를 숨긴다 — 문장을 짓지 않는다. */
const analysisHighlight = ref<string | null>(null)
const goal = computed(() => ({
  label: serverGoal.value?.name ?? '등록된 목표 없음',
  sub: serverGoal.value ? `${serverGoal.value.name} 마련` : '목표 자금 마련',
  percent:
    serverGoal.value?.projectedRate === null || serverGoal.value?.projectedRate === undefined
      ? null
      : Math.round(serverGoal.value.projectedRate * 100),
  saved: (serverGoal.value?.currentAmount ?? 0) + (serverGoal.value?.adoptedSaving ?? 0),
  target: serverGoal.value?.targetAmount ?? 0,
}))

const spendingChangeRate = computed(() => {
  const previous = monthlyReport.value?.previousTotalSpending
  const current = monthlyReport.value?.totalSpending
  if (previous === null || previous === undefined || current === undefined || previous === 0)
    return null
  return Math.round(((current - previous) / previous) * 100)
})

const savingsSummary = computed(() => {
  const amount = monthlyReport.value?.savedAmount

  if (amount === null || amount === undefined) {
    return {
      label: '이번 달 절감액',
      detailLabel: '이번 달 총 절감액',
      amount: '데이터 없음',
    }
  }

  const isExtraSpending = amount < 0
  return {
    label: isExtraSpending ? '이번 달 추가 지출' : '이번 달 절감액',
    detailLabel: isExtraSpending ? '이번 달 총 추가 지출' : '이번 달 총 절감액',
    amount: `${Math.abs(amount).toLocaleString('ko-KR')}원`,
  }
})

onMounted(async () => {
  const [goalsResult, reportResult, suggestionsResult, notificationsResult, analysisResult] =
    await Promise.allSettled([
      getGoals(),
      getMonthlyReport(),
      getSuggestions('ADOPTED'),
      getNotifications(),
      getAnalysis(),
    ])
  if (goalsResult.status === 'fulfilled') serverGoal.value = goalsResult.value[0] ?? null
  if (reportResult.status === 'fulfilled') monthlyReport.value = reportResult.value
  if (suggestionsResult.status === 'fulfilled') adoptedSuggestions.value = suggestionsResult.value
  if (notificationsResult.status === 'fulfilled')
    unreadCount.value = notificationsResult.value.unreadCount
  if (analysisResult.status === 'fulfilled')
    analysisHighlight.value = analysisResult.value.highlight.trim() || null
})

/** 03 `3-1` 3. 보조 지표 — `3-2 반복 횟수 변화` (FR-08-07). 전월이 없으면 이번 달 값만 말한다. */
const repeatChange = computed(() => {
  const report = monthlyReport.value
  if (report === null) return null

  const current = report.repeatCount
  const previous = report.previousRepeatCount
  if (previous === null) return { current, previous, deltaLabel: null, decreased: false }

  const delta = current - previous
  return {
    current,
    previous,
    deltaLabel: delta === 0 ? '변화 없음' : `${Math.abs(delta)}회 ${delta < 0 ? '감소' : '증가'}`,
    decreased: delta < 0,
  }
})

const savingsActions = computed(() =>
  adoptedSuggestions.value.map((suggestion) => ({
    label: `${suggestion.behaviorName} 줄이기`,
    amount: suggestion.expectedSaving,
    behaviorId: suggestion.behaviorId,
    icon: IconMoped,
  })),
)

const weeklyTrend = [19_000, 24_000, 17_000, 31_000, 28_000, 35_000, 46_000]
const weeklyLabels = ['3월', '4월', '5월', '6월', '7월', '8월', '9월']
const topCategories = [
  { label: '외식/배달', amount: 21_000, icon: IconBurger },
  { label: '카페/간식', amount: 13_000, icon: IconCoffee },
  { label: '교통', amount: 12_000, icon: IconCar },
]

const quadrantCounts = computed(() => {
  const points = mapStore.data?.points
  const counts = { PROTECT: 0, KEEP: 0, MINOR: 0, PRIORITY: 0 }
  if (points === undefined || points.length === 0)
    return { PROTECT: 1, KEEP: 2, MINOR: 1, PRIORITY: 2 }
  for (const point of points) {
    if (point.evaluationStatus === 'RESOLVED' && point.quadrant !== null)
      counts[point.quadrant] += 1
  }
  return counts
})

const satisfactionPreview = computed(() => [
  {
    key: PRESCRIPTION_LABEL.PROTECT,
    count: quadrantCounts.value.PROTECT,
    icon: IconCrown,
    bg: 'bg-preview-green',
    text: 'text-preview-green-ink',
  },
  {
    key: PRESCRIPTION_LABEL.KEEP,
    count: quadrantCounts.value.KEEP,
    icon: IconThumbUp,
    bg: 'bg-preview-blue',
    text: 'text-preview-blue-ink',
  },
  {
    key: PRESCRIPTION_LABEL.MINOR,
    count: quadrantCounts.value.MINOR,
    icon: IconMoodAnnoyed,
    bg: 'bg-preview-yellow',
    text: 'text-preview-yellow-ink',
  },
  {
    key: PRESCRIPTION_LABEL.PRIORITY,
    count: quadrantCounts.value.PRIORITY,
    icon: IconMoodX,
    bg: 'bg-preview-red',
    text: 'text-preview-red-ink',
  },
])

function openBehavior(behaviorId: number) {
  void router.push({ name: 'behavior-detail', params: { behaviorId } })
}
</script>

<template>
  <div class="flex h-full flex-col">
    <header
      v-if="subview === 'dashboard'"
      class="flex h-14 shrink-0 items-center justify-between px-4"
    >
      <div class="flex items-center gap-1">
        <h1 class="text-ink text-lg font-extrabold tracking-tight">소때잡</h1>
        <IconSparkles
          class="text-brand"
          :size="14"
        />
      </div>
      <div class="-mr-2 flex items-center gap-1">
        <RouterLink
          to="/notifications"
          class="text-ink relative flex size-9 items-center justify-center"
          aria-label="알림"
        >
          <IconBell :size="22" />
          <span
            v-if="unreadCount > 0"
            class="bg-verdict-adjust absolute top-2 right-2 size-1.5 rounded-full"
          ></span>
        </RouterLink>
        <RouterLink
          to="/me"
          class="text-ink flex size-9 items-center justify-center"
          aria-label="설정"
        >
          <IconSettings :size="22" />
        </RouterLink>
      </div>
    </header>
    <AppTopBar
      v-else-if="subview === 'goal'"
      title="목표 상세"
      bell
      :back-handler="() => (subview = 'dashboard')"
    />
    <AppTopBar
      v-else
      title="절감액 상세"
      :back-handler="() => (subview = 'dashboard')"
    />

    <main class="flex-1 overflow-y-auto px-5 pb-6">
      <Transition
        name="subview"
        mode="out-in"
      >
        <div
          :key="subview"
          class="space-y-4"
        >
          <template v-if="subview === 'dashboard'">
            <button
              type="button"
              class="border-line bg-surface flex w-full flex-col gap-3 rounded-[20px] border p-4 text-left"
              @click="subview = 'goal'"
            >
              <span class="flex w-full items-center justify-between">
                <span class="text-ink text-[13px] font-bold">목표 관리</span>
                <IconChevronRight
                  :size="14"
                  class="text-ink-faint"
                />
              </span>
              <span class="flex w-full items-center gap-4">
                <img
                  :src="goalTravelImage"
                  alt="여행 자금"
                  class="size-[90px] shrink-0 rounded-2xl object-contain"
                />
                <span class="flex min-w-0 flex-1 flex-col gap-1">
                  <span class="text-ink-faint text-[13px] font-medium">{{ goal.label }}</span>
                  <span class="flex items-baseline gap-1.5">
                    <span
                      v-if="goal.percent !== null"
                      class="text-brand text-4xl font-black"
                      >{{ goal.percent }}%</span
                    >
                    <span class="text-ink-faint text-[13px]">
                      {{ goal.percent === null ? '달성률 계산 전' : '달성 중' }}
                    </span>
                  </span>
                  <span class="text-ink-faint text-[13px] font-medium"
                    >{{ goal.saved.toLocaleString('ko-KR') }} /
                    {{ goal.target.toLocaleString('ko-KR') }}원</span
                  >
                </span>
              </span>
              <span class="bg-progress-track h-1.5 w-full overflow-hidden rounded-full">
                <span
                  class="bg-brand block h-full rounded-full"
                  :style="{ width: (goal.percent ?? 0) + '%' }"
                ></span>
              </span>
            </button>

            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                class="border-line bg-surface flex h-[126px] flex-col items-start gap-2.5 rounded-[20px] border p-4 text-left"
                @click="subview = 'savings'"
              >
                <span class="text-ink-faint text-[13px] font-medium">{{
                  savingsSummary.label
                }}</span>
                <span class="text-brand flex items-baseline gap-0.5 font-bold">
                  <span class="text-[22px]">{{ savingsSummary.amount }}</span>
                </span>
                <span
                  v-if="spendingChangeRate !== null"
                  class="bg-brand-soft text-brand rounded-md px-2 py-1 text-[10px] font-bold"
                >
                  전월 대비 {{ spendingChangeRate > 0 ? '+' : '' }}{{ spendingChangeRate }}%
                </span>
              </button>
              <button
                type="button"
                class="border-line bg-surface flex h-[126px] flex-col items-start gap-1.5 rounded-[20px] border p-4 text-left"
                @click="subview = 'savings'"
              >
                <span class="flex w-full items-center justify-between">
                  <span class="text-ink-faint text-[13px] font-medium">반복 횟수 변화</span>
                  <span
                    class="bg-progress-track text-ink-faint rounded-md px-1.5 py-0.5 text-[10px]"
                    >이번 달 기준</span
                  >
                </span>
                <span
                  v-if="repeatChange === null"
                  class="text-ink text-xl font-bold"
                  >데이터 없음</span
                >
                <template v-else-if="repeatChange.deltaLabel === null">
                  <span class="text-ink text-xl font-bold">{{ repeatChange.current }}회</span>
                  <span class="text-ink-faint text-xs font-medium">전월 데이터 없음</span>
                </template>
                <template v-else>
                  <span class="text-ink text-xl font-bold"
                    >{{ repeatChange.previous }}회 → {{ repeatChange.current }}회</span
                  >
                  <span
                    class="text-xs font-bold"
                    :class="repeatChange.decreased ? 'text-brand' : 'text-ink-faint'"
                    >{{ repeatChange.deltaLabel }}</span
                  >
                </template>
              </button>
            </div>

            <button
              v-if="analysisHighlight !== null"
              type="button"
              class="border-brand bg-brand-soft flex min-h-[122px] w-full items-center rounded-[20px] border p-4 text-left"
              @click="router.push('/chat')"
            >
              <span class="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                <span class="text-ink flex items-center gap-1 text-xs font-bold"
                  ><IconSparkles
                    :size="13"
                    class="text-brand"
                  />
                  AI 브리핑</span
                >
                <span class="text-ink-muted text-sm leading-5 font-bold">{{
                  analysisHighlight
                }}</span>
                <span class="text-ink-faint text-[10px] font-medium">자세히 보기 &gt;</span>
              </span>
              <img
                :src="aiBriefingImage"
                alt=""
                class="h-[90px] w-[124px] shrink-0 object-contain"
              />
            </button>

            <section class="border-line bg-surface flex flex-col gap-3 rounded-[20px] border p-4">
              <div class="flex items-center justify-between">
                <h2 class="text-ink text-[13px] font-bold">만족도 지도 미리보기</h2>
                <button
                  type="button"
                  class="text-ink-faint text-xs font-medium"
                  @click="router.push('/map')"
                >
                  전체 보기 &gt;
                </button>
              </div>
              <div class="grid grid-cols-2 gap-2.5">
                <button
                  v-for="q in satisfactionPreview"
                  :key="q.key"
                  type="button"
                  class="flex items-center justify-between rounded-2xl px-3.5 py-3 text-left"
                  :class="q.bg"
                  @click="router.push('/map')"
                >
                  <span
                    class="flex items-center gap-2 text-[13px] font-bold"
                    :class="q.text"
                  >
                    <component
                      :is="q.icon"
                      :size="20"
                    />{{ q.key }}
                  </span>
                  <span
                    class="text-[13px] font-medium"
                    :class="q.text"
                    >{{ q.count }}개</span
                  >
                </button>
              </div>
            </section>
          </template>
          <template v-else-if="subview === 'goal'">
            <div class="flex items-center gap-3 py-2">
              <img
                :src="goalTravelImage"
                alt="여행 자금"
                class="h-[55px] w-[70px] shrink-0 rounded-3xl object-cover"
              />
              <p class="text-ink text-base font-bold">{{ goal.sub }}</p>
            </div>
            <div
              class="border-line bg-surface flex items-center gap-3.5 rounded-[20px] border p-3.5"
            >
              <div
                class="relative flex size-[90px] shrink-0 items-center justify-center rounded-full"
                :style="{
                  background:
                    'conic-gradient(var(--color-brand) ' +
                    (goal.percent ?? 0) * 3.6 +
                    'deg, var(--color-line) 0deg)',
                }"
              >
                <div
                  class="bg-surface absolute inset-[9px] flex items-center justify-center rounded-full"
                >
                  <span class="text-ink text-lg font-black">
                    {{ goal.percent === null ? '-' : `${goal.percent}%` }}
                  </span>
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <p class="text-ink-faint text-[11px] font-medium">모은 금액</p>
                <p class="text-ink text-xl font-bold">{{ goal.saved.toLocaleString('ko-KR') }}원</p>
                <p class="text-ink-faint text-[11px]">
                  / {{ goal.target.toLocaleString('ko-KR') }}원
                </p>
              </div>
            </div>
            <div class="border-line rounded-2xl border px-4 py-2.5 text-center">
              <div class="flex flex-col gap-1">
                <p class="text-ink-faint text-[10px]">목표 금액</p>
                <p class="text-ink text-xs font-bold">
                  {{ goal.target.toLocaleString('ko-KR') }}원
                </p>
              </div>
            </div>
            <section class="pt-2">
              <div class="mb-2">
                <h2 class="text-ink text-sm font-bold">AI가 찾은 절약 가능 항목</h2>
                <p class="text-ink-faint mt-0.5 text-[11px]">
                  이렇게 소비를 줄이면 아낄 수 있어요.
                </p>
              </div>
              <div
                v-if="savingsActions.length > 0"
                class="divide-line border-line divide-y overflow-hidden rounded-[20px] border py-1"
              >
                <button
                  v-for="a in savingsActions"
                  :key="a.label"
                  type="button"
                  class="flex h-14 w-full items-center justify-between px-4"
                  @click="openBehavior(a.behaviorId)"
                >
                  <span class="flex items-center gap-3">
                    <span class="bg-brand-soft flex size-9 items-center justify-center rounded-full"
                      ><component
                        :is="a.icon"
                        :size="18"
                        class="text-brand"
                    /></span>
                    <span class="text-ink text-[13px] font-semibold">{{ a.label }}</span>
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="text-success text-[13px] font-semibold"
                      >월 {{ a.amount.toLocaleString('ko-KR') }}원 절약 가능</span
                    >
                    <IconChevronRight
                      :size="16"
                      class="text-ink-faint"
                    />
                  </span>
                </button>
              </div>
              <p
                v-else
                class="border-line text-ink-muted rounded-[20px] border p-4 text-center text-xs"
              >
                아직 채택한 절약 제안이 없어요.
              </p>
            </section>
          </template>
          <template v-else>
            <h1 class="text-ink text-xl font-bold">절감액 상세</h1>

            <AppCard>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-ink-muted text-sm">{{ savingsSummary.detailLabel }}</p>
                  <p class="text-brand text-3xl font-extrabold">
                    {{ savingsSummary.amount }}
                  </p>
                  <span
                    v-if="spendingChangeRate !== null"
                    class="text-satisfaction-high bg-satisfaction-high/10 mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                  >
                    전월 대비 {{ spendingChangeRate > 0 ? '+' : '' }}{{ spendingChangeRate }}%
                  </span>
                </div>
                <img
                  :src="savingsImage"
                  alt="절감액"
                  class="h-[100px] w-[150px] shrink-0 rounded-2xl object-cover"
                />
              </div>
            </AppCard>

            <AppCard v-if="monthlyReport !== null">
              <p class="text-ink text-sm font-semibold">보조 지표</p>
              <dl class="mt-2.5 flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <dt class="text-ink-muted text-[13px]">아쉬운 소비 건수</dt>
                  <dd class="text-ink text-[13px] font-semibold">
                    {{ monthlyReport.unsatisfiedCount }}건
                  </dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-ink-muted text-[13px]">반복 횟수</dt>
                  <dd class="text-ink text-[13px] font-semibold">
                    <template v-if="repeatChange?.deltaLabel == null">
                      {{ monthlyReport.repeatCount }}회 · 전월 데이터 없음
                    </template>
                    <template v-else>
                      {{ repeatChange.previous }}회 → {{ repeatChange.current }}회 ·
                      {{ repeatChange.deltaLabel }}
                    </template>
                  </dd>
                </div>
              </dl>
            </AppCard>

            <AppCard>
              <p class="text-ink text-sm font-semibold">월별 절감액 추이</p>
              <WeeklyTrendChart
                :values="weeklyTrend"
                :labels="weeklyLabels"
              />
            </AppCard>

            <div>
              <p class="text-ink mb-2 text-sm font-semibold">절감 카테고리 TOP 3</p>
              <div class="divide-line border-line divide-y rounded-2xl border">
                <button
                  v-for="c in topCategories"
                  :key="c.label"
                  type="button"
                  class="flex w-full items-center justify-between px-4 py-3.5"
                >
                  <span class="flex items-center gap-3">
                    <span class="bg-brand-soft flex size-8 items-center justify-center rounded-lg">
                      <component
                        :is="c.icon"
                        :size="18"
                        class="text-brand"
                      />
                    </span>
                    <span class="text-ink text-sm font-bold">{{ c.label }}</span>
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="text-ink text-sm font-bold"
                      >{{ c.amount.toLocaleString('ko-KR') }}원</span
                    >
                    <IconChevronRight
                      :size="15"
                      class="text-ink-muted"
                    />
                  </span>
                </button>
              </div>
            </div>
          </template>
        </div>
      </Transition>
    </main>

    <AppBottomNav />
  </div>
</template>
