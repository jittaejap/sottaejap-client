<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Satisfaction } from '@/api/enums'
import AppBottomNav from '@/components/common/AppBottomNav.vue'
import AppFilterDropdown from '@/components/common/AppFilterDropdown.vue'
import AppTopBar from '@/components/common/AppTopBar.vue'
import CategoryIcon from '@/components/common/category-icon.vue'
import MerchantBadge from '@/components/common/MerchantBadge.vue'
import { reviewsForBehavior } from '@/data/behavior-reviews'

const route = useRoute()
const router = useRouter()
const behavior = computed(() =>
  typeof route.query.behavior === 'string' ? route.query.behavior : '심야 배달',
)
const satisfaction = ref<'ALL' | Satisfaction>('ALL')
const period = ref('최근 3개월')
const sort = ref('최근 완료')
const periodOptions = [
  { value: '최근 3개월', label: '최근 3개월' },
  { value: '최근 1개월', label: '최근 1개월' },
  { value: '전체 기간', label: '전체 기간' },
] as const
const satisfactionOptions = [
  { value: 'ALL', label: '만족도' },
  { value: 'HIGH', label: '만족했어요' },
  { value: 'LOW', label: '별로예요' },
  { value: 'UNKNOWN', label: '모르겠어요' },
] as const
const sortOptions = [
  { value: '최근 완료', label: '최근 완료' },
  { value: '오래된 순', label: '오래된 순' },
] as const
const reviews = computed(() => reviewsForBehavior(behavior.value))
const satisfactionMeta: Record<Satisfaction, { label: string; badge: string }> = {
  HIGH: { label: '만족했어요', badge: 'bg-success-soft text-success' },
  LOW: { label: '별로예요', badge: 'bg-brand-soft text-brand' },
  UNKNOWN: { label: '모르겠어요', badge: 'bg-surface-muted text-ink-faint' },
}
const filteredReviews = computed(() =>
  satisfaction.value === 'ALL'
    ? reviews.value
    : reviews.value.filter((review) => review.satisfaction === satisfaction.value),
)
const total = computed(() => filteredReviews.value.reduce((sum, item) => sum + item.amount, 0))
</script>

<template>
  <div class="bg-surface flex h-full flex-col">
    <AppTopBar
      title="회고 내역"
      :back-handler="() => router.back()"
    />
    <main class="flex-1 overflow-y-auto pb-5">
      <section class="flex items-center gap-3 px-5 py-4">
        <span class="bg-brand-soft text-brand flex size-11 items-center justify-center rounded-full"
          ><CategoryIcon
            :category="behavior"
            :size="20"
        /></span>
        <div>
          <h1 class="text-ink font-extrabold">{{ behavior }}</h1>
          <p class="text-ink-muted text-xs">밤 늦게 시키는 배달 음식</p>
        </div>
      </section>
      <section class="flex gap-1.5 px-5 pb-2">
        <AppFilterDropdown
          v-model="period"
          label="기간 필터"
          :options="periodOptions"
          active
        />
        <AppFilterDropdown
          v-model="satisfaction"
          label="만족도 필터"
          :options="satisfactionOptions"
          :active="satisfaction !== 'ALL'"
        />
        <AppFilterDropdown
          v-model="sort"
          label="정렬 필터"
          :options="sortOptions"
        />
      </section>
      <section class="space-y-3 px-5 py-4">
        <div class="flex items-center justify-between text-[13px] font-bold">
          <p class="text-ink">회고 완료 총 {{ filteredReviews.length }}건</p>
          <p class="text-brand">총 {{ total.toLocaleString('ko-KR') }}원</p>
        </div>
        <article
          v-for="review in filteredReviews"
          :key="review.merchant + review.at"
          class="border-line bg-surface flex items-center gap-3 rounded-2xl border p-4"
        >
          <MerchantBadge :name="review.merchant" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between">
              <strong class="text-ink text-sm">{{ review.merchant }}</strong
              ><strong class="text-ink text-sm"
                >{{ review.amount.toLocaleString('ko-KR') }}원</strong
              >
            </div>
            <div class="mt-1 flex items-center justify-between">
              <span class="text-ink-faint text-[11px]">{{ review.at }}</span
              ><span
                class="rounded-md px-2 py-1 text-[10px] font-bold"
                :class="satisfactionMeta[review.satisfaction].badge"
                >{{ satisfactionMeta[review.satisfaction].label }}</span
              >
            </div>
            <p class="text-brand mt-1 text-[11px]">{{ review.purpose }}</p>
          </div>
        </article>
      </section>
    </main>
    <AppBottomNav />
  </div>
</template>
