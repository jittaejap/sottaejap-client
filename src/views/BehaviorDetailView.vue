<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IconBell,
  IconCreditCard,
  IconFileText,
  IconMessage2,
  IconSettings,
  IconStar,
} from '@tabler/icons-vue'
import AppBottomNav from '@/components/common/AppBottomNav.vue'
import AppTopBar from '@/components/common/AppTopBar.vue'
import CategoryIcon from '@/components/common/category-icon.vue'
import PrimaryButton from '@/components/common/PrimaryButton.vue'
import type { Satisfaction } from '@/api/enums'
import { reviewsForBehavior } from '@/data/behavior-reviews'
const route = useRoute()
const router = useRouter()
const behavior = computed(() =>
  typeof route.query.behavior === 'string' ? route.query.behavior : '심야 배달',
)
const detail = computed(() => ({
  name: behavior.value,
  description:
    behavior.value === '심야 배달' ? '밤 늦게 시키는 배달 음식' : '최근 30일 기준 소비 행동이에요',
  total: 92_000,
  count: 4,
}))
const reviews = computed(() => reviewsForBehavior(behavior.value))
const satisfactionCounts = computed<Record<Satisfaction, number>>(() => {
  const counts = { HIGH: 0, LOW: 0, UNKNOWN: 0 }
  for (const review of reviews.value) counts[review.satisfaction] += 1
  return counts
})
const satisfactionLabels: Record<Satisfaction, string> = {
  HIGH: '만족',
  LOW: '불만족',
  UNKNOWN: '모르겠어요',
}
const leadingSatisfaction = computed(() => {
  const entries = Object.entries(satisfactionCounts.value) as [Satisfaction, number][]
  const max = Math.max(...entries.map(([, count]) => count), 0)
  return entries.filter(([, count]) => count === max && count > 0)
})
const leadingSatisfactionText = computed(() =>
  leadingSatisfaction.value.length === 0
    ? '평가 없음'
    : leadingSatisfaction.value
        .map(([value, count]) => `${satisfactionLabels[value]} ${count}건`)
        .join(' · '),
)
function openReviews() {
  void router.push({ name: 'behavior-reviews', query: { behavior: behavior.value } })
}
function openActionPlan() {
  void router.push({ name: 'chat', query: { step: 'improvement', behavior: behavior.value } })
}
function openTransactions() {
  void router.push({ name: 'transactions', query: { category: behavior.value } })
}
</script>
<template>
  <div class="bg-surface flex h-full flex-col">
    <AppTopBar
      title="행동 상세"
      :back-handler="() => router.back()"
      ><template #right
        ><RouterLink
          to="/notifications"
          class="text-ink flex size-9 items-center justify-center"
          aria-label="알림"
          ><IconBell :size="22" /></RouterLink
        ><RouterLink
          to="/me"
          class="text-ink flex size-9 items-center justify-center"
          aria-label="설정"
          ><IconSettings :size="22" /></RouterLink></template
    ></AppTopBar>
    <main class="flex-1 overflow-y-auto px-5 pb-5">
      <section class="flex flex-col items-center gap-3 py-4 text-center">
        <span class="bg-brand-soft text-brand flex size-16 items-center justify-center rounded-full"
          ><CategoryIcon
            :category="detail.name"
            :size="32"
        /></span>
        <div>
          <h1 class="text-ink text-[22px] font-extrabold">{{ detail.name }}</h1>
          <p class="text-ink-muted text-[13px]">{{ detail.description }}</p>
        </div>
        <div class="flex gap-2">
          <span class="bg-brand-soft text-brand rounded-lg px-2.5 py-1.5 text-xs font-bold"
            >만족도 낮음</span
          ><span
            class="bg-preview-red text-preview-red-ink rounded-lg px-2.5 py-1.5 text-xs font-bold"
            >지출 부담 높음</span
          >
        </div>
      </section>
      <section>
        <h2 class="text-ink mb-3 text-sm font-bold">핵심 지표</h2>
        <div class="grid grid-cols-2 gap-3">
          <article class="border-line bg-surface rounded-2xl border p-4">
            <p class="text-ink-faint flex items-center justify-between text-[11px] font-medium">
              총 지출 금액
              <IconCreditCard
                :size="18"
                class="text-brand"
              />
            </p>
            <p class="text-ink mt-2 text-lg font-extrabold">
              {{ detail.total.toLocaleString('ko-KR') }}원
            </p>
            <p class="text-ink-muted mt-1 text-[10px]">최근 30일 누적</p>
          </article>
          <article class="border-line bg-surface rounded-2xl border p-4">
            <p class="text-ink-faint flex items-center justify-between text-[11px] font-medium">
              이용 횟수
              <IconFileText
                :size="18"
                class="text-brand"
              />
            </p>
            <p class="text-ink mt-2 text-lg font-extrabold">{{ detail.count }}회</p>
            <p class="text-ink-muted mt-1 text-[10px]">전월 대비 +1회</p>
          </article>
          <button
            type="button"
            class="border-line bg-surface rounded-2xl border p-4 text-left"
            @click="openReviews"
          >
            <p class="text-ink-faint flex items-center justify-between text-[11px] font-medium">
              만족도 평가
              <IconStar
                :size="18"
                class="text-brand"
              />
            </p>
            <p class="text-ink mt-2 text-lg font-extrabold">{{ leadingSatisfactionText }}</p>
            <p class="text-ink-muted mt-1 text-[10px]">
              만족 {{ satisfactionCounts.HIGH }}건 · 모르겠어요 {{ satisfactionCounts.UNKNOWN }}건
            </p>
          </button>
          <button
            type="button"
            class="border-line bg-surface rounded-2xl border p-4 text-left"
            @click="openReviews"
          >
            <p class="text-ink-faint flex items-center justify-between text-[11px] font-medium">
              회고 건수
              <IconMessage2
                :size="18"
                class="text-brand"
              />
            </p>
            <p class="text-ink mt-2 text-lg font-extrabold">{{ reviews.length }}건 완료</p>
            <p class="text-ink-muted mt-1 text-[10px]">회고 작성률 100%</p>
          </button>
        </div>
      </section>
      <div class="mt-4 space-y-3">
        <PrimaryButton @click="openActionPlan">개선방안 제안받기</PrimaryButton
        ><PrimaryButton
          variant="outline"
          @click="openTransactions"
          >거래 내역 보기</PrimaryButton
        >
      </div>
    </main>
    <AppBottomNav />
  </div>
</template>
