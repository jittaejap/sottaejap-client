<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconBell,
  IconChevronRight,
  IconCoins,
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
import { useMapStore } from '@/stores/map'

const router = useRouter()
const mapStore = useMapStore()
const subview = ref<'dashboard' | 'goal' | 'savings'>('dashboard')

const goal = {
  label: '여행 자금',
  sub: '여행 자금 마련',
  percent: 31,
  saved: 310_000,
  target: 1_000_000,
  dueDate: '2025.12.31까지',
  daysLeft: 58,
}

const savingsActions = [
  { label: '심야 배달 줄이기', amount: 46_000, behavior: '심야 배달', icon: IconMoped },
  { label: '카페 이용 줄이기', amount: 12_000, behavior: '카페', icon: IconCoffee },
  { label: '택시 이용 줄이기', amount: 11_000, behavior: '택시', icon: IconCar },
]

const weeklyTrend = [19_000, 24_000, 17_000, 31_000, 28_000, 35_000, 46_000]
const weeklyLabels = ['3월', '4월', '5월', '6월', '7월', '8월', '9월']
const topCategories = [
  { label: '외식/배달', amount: 21_000 },
  { label: '카페/간식', amount: 13_000 },
  { label: '교통', amount: 12_000 },
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

function openBehavior(behavior: string) {
  void router.push({ path: '/map', query: { behavior } })
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
          class="text-ink flex size-9 items-center justify-center"
          aria-label="알림"
        >
          <IconBell :size="22" />
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
      :back-handler="() => (subview = 'dashboard')"
    />

    <main class="flex-1 space-y-4 overflow-y-auto px-5 pb-6">
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
                <span class="text-brand text-4xl font-black">{{ goal.percent }}%</span>
                <span class="text-ink-faint text-[13px]">달성 중</span>
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
              :style="{ width: goal.percent + '%' }"
            ></span>
          </span>
        </button>

        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="border-line bg-surface flex h-[126px] flex-col items-start gap-2.5 rounded-[20px] border p-4 text-left"
            @click="subview = 'savings'"
          >
            <span class="text-ink-faint text-[13px] font-medium">이번 달 절감액</span>
            <span class="text-brand flex items-baseline gap-0.5 font-bold"
              ><span class="text-[22px]">46,000</span><span class="text-sm">원</span></span
            >
            <span class="bg-brand-soft text-brand rounded-md px-2 py-1 text-[10px] font-bold"
              >전월 대비 +12%</span
            >
          </button>
          <button
            type="button"
            class="border-line bg-surface flex h-[126px] flex-col items-start gap-1.5 rounded-[20px] border p-4 text-left"
            @click="openBehavior('심야 배달')"
          >
            <span class="flex w-full items-center justify-between">
              <span class="text-ink-faint text-[13px] font-medium">행동 변화</span>
              <span class="bg-progress-track text-ink-faint rounded-md px-1.5 py-0.5 text-[10px]"
                >이번 달 기준</span
              >
            </span>
            <span class="text-ink text-[13px] font-medium">심야 배달</span>
            <span class="text-ink text-xl font-bold">4회 → 2회</span>
            <span class="text-brand text-xs font-bold">-50% 감소</span>
          </button>
        </div>

        <button
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
            <span class="text-ink-muted text-sm font-bold leading-5"
              >심야 배달을 줄인 덕분에 식비가<br />18% 줄었어요! 👍</span
            >
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
        <div class="border-line bg-surface flex items-center gap-3.5 rounded-[20px] border p-3.5">
          <div
            class="relative flex size-[90px] shrink-0 items-center justify-center rounded-full"
            :style="{
              background:
                'conic-gradient(var(--color-brand) ' +
                goal.percent * 3.6 +
                'deg, var(--color-line) 0deg)',
            }"
          >
            <div
              class="bg-surface absolute inset-[9px] flex items-center justify-center rounded-full"
            >
              <span class="text-ink text-lg font-black">{{ goal.percent }}%</span>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <p class="text-ink-faint text-[11px] font-medium">모은 금액</p>
            <p class="text-ink text-xl font-bold">{{ goal.saved.toLocaleString('ko-KR') }}원</p>
            <p class="text-ink-faint text-[11px]">/ {{ goal.target.toLocaleString('ko-KR') }}원</p>
          </div>
        </div>
        <div
          class="divide-line border-line grid grid-cols-3 divide-x rounded-2xl border px-4 py-2.5 text-center"
        >
          <div class="flex flex-col gap-1">
            <p class="text-ink-faint text-[10px]">목표 금액</p>
            <p class="text-ink text-xs font-bold">{{ goal.target.toLocaleString('ko-KR') }}원</p>
          </div>
          <div class="flex flex-col gap-1">
            <p class="text-ink-faint text-[10px]">목표 기간</p>
            <p class="text-ink text-xs font-bold">{{ goal.dueDate }}</p>
          </div>
          <div class="flex flex-col gap-1">
            <p class="text-ink-faint text-[10px]">남은 기간</p>
            <p class="text-brand text-xs font-bold">{{ goal.daysLeft }}일</p>
          </div>
        </div>
        <section class="pt-2">
          <div class="mb-2">
            <h2 class="text-ink text-sm font-bold">AI가 찾은 절약 가능 항목</h2>
            <p class="text-ink-faint mt-0.5 text-[11px]">이렇게 소비를 줄이면 아낄 수 있어요.</p>
          </div>
          <div class="divide-line border-line divide-y overflow-hidden rounded-[20px] border py-1">
            <button
              v-for="a in savingsActions"
              :key="a.label"
              type="button"
              class="flex h-14 w-full items-center justify-between px-4"
              @click="openBehavior(a.behavior)"
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
        </section>
      </template>
      <template v-else>
        <h1 class="text-ink text-xl font-bold">절감액 상세</h1>

        <AppCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-ink-muted text-sm">이번 달 총 절감액</p>
              <p class="text-brand text-3xl font-extrabold">
                46,000<span class="text-lg">원</span>
              </p>
              <span
                class="text-satisfaction-high bg-satisfaction-high/10 mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              >
                전월 대비 +12%
              </span>
            </div>
            <span
              class="bg-surface-muted flex size-16 shrink-0 items-center justify-center rounded-full"
            >
              <IconCoins
                :size="30"
                class="text-brand"
                :stroke-width="1.5"
              />
            </span>
          </div>
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
              <span class="text-ink text-sm font-medium">{{ c.label }}</span>
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
    </main>

    <AppBottomNav />
  </div>
</template>
