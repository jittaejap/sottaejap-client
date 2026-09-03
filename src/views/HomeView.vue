<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconArrowUpRight,
  IconBeach,
  IconBell,
  IconChevronRight,
  IconCoins,
  IconCrown,
  IconMoodAnnoyed,
  IconMoodX,
  IconMoonStars,
  IconRobot,
  IconSettings,
  IconSparkles,
  IconThumbUp,
} from '@tabler/icons-vue'

import AppBottomNav from '@/components/common/AppBottomNav.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppTopBar from '@/components/common/AppTopBar.vue'
import WeeklyTrendChart from '@/components/common/WeeklyTrendChart.vue'
import { PRESCRIPTION_LABEL } from '@/components/map/verdictStyle'

const router = useRouter()
const subview = ref<'dashboard' | 'goal' | 'savings'>('dashboard')

const goal = {
  label: '여행 자금',
  sub: '여행 경비 마련',
  percent: 31,
  saved: 310_000,
  target: 1_000_000,
  dueDate: '2025.12.31까지',
  daysLeft: 58,
}

const savingsActions = [
  { label: '심야 배달 감소', amount: 46_000, behavior: '심야 배달' },
  { label: '카페 감소', amount: 12_000, behavior: '카페' },
  { label: '택시 감소', amount: 11_000, behavior: '택시' },
]

const weeklyTrend = [14_000, 9_000, 23_000, 18_000, 27_000, 46_000, 33_000]
const weeklyLabels = ['월', '화', '수', '목', '금', '토', '일']
const topCategories = [
  { label: '외식/배달', amount: 21_000 },
  { label: '카페/간식', amount: 13_000 },
  { label: '교통', amount: 12_000 },
]

const satisfactionPreview = [
  { key: PRESCRIPTION_LABEL.PROTECT, count: 378, icon: IconCrown, tone: 'sustain' as const },
  { key: PRESCRIPTION_LABEL.KEEP, count: 478, icon: IconThumbUp, tone: 'sustain' as const },
  { key: PRESCRIPTION_LABEL.MINOR, count: 278, icon: IconMoodAnnoyed, tone: 'adjust' as const },
  { key: PRESCRIPTION_LABEL.PRIORITY, count: 378, icon: IconMoodX, tone: 'adjust' as const },
]

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
      bell
      :back-handler="() => (subview = 'dashboard')"
    />
    <AppTopBar
      v-else
      :back-handler="() => (subview = 'dashboard')"
    />

    <main class="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
      <template v-if="subview === 'dashboard'">
        <AppCard>
          <div class="flex items-center justify-between">
            <span class="text-ink text-sm font-semibold">목표 달성 현황</span>
            <button
              type="button"
              class="bg-surface-muted text-ink-muted flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
              @click="subview = 'goal'"
            >
              목표 관리 <IconChevronRight :size="12" />
            </button>
          </div>
          <div class="mt-4 flex items-center gap-4">
            <span
              class="bg-surface-muted flex size-16 shrink-0 items-center justify-center rounded-2xl"
            >
              <IconBeach
                :size="32"
                class="text-brand"
                :stroke-width="1.5"
              />
            </span>
            <div class="flex-1">
              <p class="text-ink-muted text-sm">{{ goal.label }}</p>
              <p class="text-brand text-3xl font-extrabold">{{ goal.percent }}%</p>
              <p class="text-ink-muted text-sm">
                {{ goal.saved.toLocaleString('ko-KR') }} /
                {{ goal.target.toLocaleString('ko-KR') }}원
              </p>
            </div>
          </div>
          <div class="bg-surface-muted mt-3 h-2 w-full rounded-full">
            <div
              class="bg-brand h-2 rounded-full"
              :style="{ width: goal.percent + '%' }"
            ></div>
          </div>
        </AppCard>

        <div class="grid grid-cols-2 gap-3">
          <AppCard
            class="cursor-pointer"
            @click="subview = 'savings'"
          >
            <p class="text-ink-muted text-xs font-semibold">이번 달 절감액</p>
            <p class="text-brand mt-1 text-xl font-extrabold">
              46,000<span class="text-sm font-semibold">원</span>
            </p>
            <p class="text-brand mt-1 flex items-center gap-1 text-xs font-medium">
              <IconArrowUpRight :size="13" />
              지난달 대비 +12%
            </p>
          </AppCard>
          <AppCard
            class="cursor-pointer"
            @click="openBehavior('심야 배달')"
          >
            <div class="flex items-center justify-between">
              <p class="text-ink-muted text-xs font-semibold">행동 변화</p>
              <span class="bg-surface-muted text-ink-muted rounded-full px-1.5 py-0.5 text-[10px]"
                >이번 달 기준</span
              >
            </div>
            <p class="text-ink mt-1 flex items-center gap-1 text-sm font-semibold">
              <IconMoonStars
                :size="14"
                class="text-brand"
              />
              심야 배달
            </p>
            <p class="text-ink text-lg font-extrabold">4회 → 2회</p>
            <p class="text-satisfaction-high text-xs font-medium">-50% 감소</p>
          </AppCard>
        </div>

        <button
          type="button"
          class="bg-brand/5 border-brand/20 block w-full rounded-2xl border p-4 text-left"
          @click="router.push('/chat')"
        >
          <span class="text-brand flex items-center gap-1.5 text-sm font-semibold">
            <IconSparkles :size="15" /> AI 브리핑
          </span>
          <div class="mt-2 flex items-center gap-3">
            <span class="bg-surface flex size-12 shrink-0 items-center justify-center rounded-full">
              <IconRobot
                :size="24"
                class="text-brand"
              />
            </span>
            <p class="text-ink text-sm leading-relaxed">
              심야 배달을 줄이고 직접 요리를 늘린 덕분에 식비가 18% 줄었어요! 👍
            </p>
          </div>
          <span class="text-brand mt-2 flex items-center text-xs font-semibold"
            >자세히 보기 <IconChevronRight :size="13"
          /></span>
        </button>

        <div>
          <div class="mb-2 flex items-center justify-between">
            <span class="text-ink text-sm font-semibold">만족도 지도 미리보기</span>
            <button
              type="button"
              class="text-ink-muted flex items-center text-xs"
              @click="router.push('/map')"
            >
              전체 보기 <IconChevronRight :size="13" />
            </button>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="q in satisfactionPreview"
              :key="q.key"
              type="button"
              class="border-line rounded-2xl border p-3 text-left"
              @click="router.push('/map')"
            >
              <span
                class="flex items-center gap-1 text-sm font-bold"
                :class="q.tone === 'sustain' ? 'text-verdict-sustain' : 'text-verdict-adjust'"
              >
                <component
                  :is="q.icon"
                  :size="15"
                />
                {{ q.key }}
              </span>
              <span class="text-ink-muted text-xs">({{ q.count }})</span>
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="subview === 'goal'">
        <div class="flex items-center gap-3">
          <span
            class="bg-surface-muted flex size-14 shrink-0 items-center justify-center rounded-2xl"
          >
            <IconBeach
              :size="28"
              class="text-brand"
              :stroke-width="1.5"
            />
          </span>
          <div>
            <p class="text-ink text-lg font-bold">{{ goal.label }}</p>
            <p class="text-ink-muted text-sm">{{ goal.sub }}</p>
          </div>
        </div>

        <AppCard>
          <div class="flex items-center gap-6">
            <div
              class="relative flex size-24 shrink-0 items-center justify-center rounded-full"
              :style="{
                background: `conic-gradient(var(--color-brand) ${goal.percent * 3.6}deg, var(--color-surface-muted) 0deg)`,
              }"
            >
              <div
                class="bg-surface absolute inset-2 flex items-center justify-center rounded-full"
              >
                <span class="text-ink text-xl font-extrabold">{{ goal.percent }}%</span>
              </div>
            </div>
            <div>
              <p class="text-ink-muted text-sm">모은 금액</p>
              <p class="text-ink text-2xl font-extrabold">
                {{ goal.saved.toLocaleString('ko-KR') }}원
              </p>
              <p class="text-ink-muted text-sm">/ {{ goal.target.toLocaleString('ko-KR') }}원</p>
            </div>
          </div>
        </AppCard>

        <div
          class="divide-line border-line grid grid-cols-3 divide-x rounded-2xl border py-3 text-center"
        >
          <div>
            <p class="text-ink-muted text-xs">목표 금액</p>
            <p class="text-ink mt-1 text-sm font-bold">
              {{ goal.target.toLocaleString('ko-KR') }}원
            </p>
          </div>
          <div>
            <p class="text-ink-muted text-xs">목표 기간</p>
            <p class="text-ink mt-1 text-sm font-bold">{{ goal.dueDate }}</p>
          </div>
          <div>
            <p class="text-ink-muted text-xs">남은 기간</p>
            <p class="text-ink mt-1 text-sm font-bold">{{ goal.daysLeft }}일</p>
          </div>
        </div>

        <AppCard>
          <p class="text-ink text-sm font-semibold">AI 추천이 만든 변화</p>
          <div class="mt-3 grid grid-cols-2 gap-3">
            <div class="bg-surface-muted rounded-xl p-3">
              <p class="text-ink-muted text-xs">추천 전 예상 달성률</p>
              <p class="text-ink text-lg font-bold">18%</p>
              <div class="mt-2 flex h-8 items-end gap-1">
                <div
                  v-for="h in [30, 45, 35, 55, 40]"
                  :key="h"
                  class="bg-ink-faint w-2 rounded-sm"
                  :style="{ height: h + '%' }"
                ></div>
              </div>
            </div>
            <div class="bg-brand/10 rounded-xl p-3">
              <p class="text-brand text-xs">추천 후 예상 달성률</p>
              <p class="text-brand text-lg font-bold">31%</p>
              <div class="mt-2 flex h-8 items-end gap-1">
                <div
                  v-for="h in [35, 50, 65, 75, 95]"
                  :key="h"
                  class="bg-brand w-2 rounded-sm"
                  :style="{ height: h + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </AppCard>

        <div>
          <p class="text-ink mb-2 text-sm font-semibold">절약을 이끄는 행동</p>
          <div class="divide-line border-line divide-y rounded-2xl border">
            <button
              v-for="a in savingsActions"
              :key="a.label"
              type="button"
              class="flex w-full items-center justify-between px-4 py-3.5"
              @click="openBehavior(a.behavior)"
            >
              <span class="text-ink text-sm font-medium">{{ a.label }}</span>
              <span class="flex items-center gap-1">
                <span class="text-satisfaction-high text-sm font-bold"
                  >+{{ a.amount.toLocaleString('ko-KR') }}원</span
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

      <template v-else>
        <h1 class="text-ink text-xl font-bold">절감액 상세</h1>

        <AppCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-ink-muted text-sm">이번 주 총 절감액</p>
              <p class="text-brand text-3xl font-extrabold">
                46,000<span class="text-lg">원</span>
              </p>
              <span
                class="text-satisfaction-high bg-satisfaction-high/10 mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              >
                지난주 대비 ▲+18%
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
          <p class="text-ink text-sm font-semibold">주간 절감액 추이</p>
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
