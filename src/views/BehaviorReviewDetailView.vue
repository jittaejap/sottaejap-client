<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBottomNav from '@/components/common/AppBottomNav.vue'
import AppTopBar from '@/components/common/AppTopBar.vue'
import CategoryIcon from '@/components/common/category-icon.vue'
import MerchantBadge from '@/components/common/MerchantBadge.vue'
import { getBehavior } from '@/api/service'
import type { BehaviorDetail } from '@/api/types'

const route = useRoute()
const router = useRouter()
const behaviorId = computed(() => Number(route.params.behaviorId))
const serverDetail = ref<BehaviorDetail | null>(null)
const behavior = computed(() => serverDetail.value?.behavior.name ?? '')
const transactions = computed(() =>
  (serverDetail.value?.transactions ?? []).map((transaction) => ({
    id: transaction.id,
    merchant: transaction.merchant,
    amount: transaction.amount,
    at: new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(transaction.occurredAt)),
    category: transaction.category,
  })),
)
const total = computed(() => transactions.value.reduce((sum, item) => sum + item.amount, 0))
onMounted(async () => {
  if (Number.isInteger(behaviorId.value)) serverDetail.value = await getBehavior(behaviorId.value)
})
</script>

<template>
  <div class="bg-surface flex h-full flex-col">
    <AppTopBar
      title="거래 내역"
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
      <section class="space-y-3 px-5 py-4">
        <div class="flex items-center justify-between text-[13px] font-bold">
          <p class="text-ink">거래 총 {{ transactions.length }}건</p>
          <p class="text-brand">총 {{ total.toLocaleString('ko-KR') }}원</p>
        </div>
        <article
          v-for="transaction in transactions"
          :key="transaction.id"
          class="border-line bg-surface flex items-center gap-3 rounded-2xl border p-4"
        >
          <MerchantBadge :name="transaction.merchant" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between">
              <strong class="text-ink text-sm">{{ transaction.merchant }}</strong
              ><strong class="text-ink text-sm"
                >{{ transaction.amount.toLocaleString('ko-KR') }}원</strong
              >
            </div>
            <div class="mt-1 flex items-center justify-between">
              <span class="text-ink-faint text-[11px]">{{ transaction.at }}</span>
            </div>
            <p class="text-brand mt-1 text-[11px]">{{ transaction.category }}</p>
          </div>
        </article>
      </section>
    </main>
    <AppBottomNav />
  </div>
</template>
