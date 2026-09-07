<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconArrowRight, IconInfoCircle, IconWallet } from '@tabler/icons-vue'

import AppTopBar from '@/components/common/AppTopBar.vue'
import MoneyInput from '@/components/common/MoneyInput.vue'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const settings = useSettingsStore()
const budget = ref(settings.monthlyBudget)

function save() {
  settings.updateBudget(budget.value)
  void router.push('/me')
}
</script>

<template>
  <div class="flex h-full flex-col">
    <AppTopBar
      title="월 예산 설정"
      back
      bell
      bell-dot
    />

    <main class="flex-1 space-y-6 overflow-y-auto px-5 pt-5 pb-6">
      <section class="space-y-2">
        <h1 class="text-ink text-[22px] leading-[1.3] font-bold">
          한 달 예산을<br />설정해 주세요
        </h1>
        <p class="text-ink-muted text-sm">월 예산은 소비 부담과 절감 목표를 분석하는 기준이에요.</p>
      </section>

      <section class="bg-brand-soft flex gap-3 rounded-2xl p-4">
        <span
          class="bg-surface text-brand flex size-10 shrink-0 items-center justify-center rounded-full"
        >
          <IconWallet :size="20" />
        </span>
        <div>
          <p class="text-ink text-sm font-bold">현재 설정한 월 예산</p>
          <p
            data-testid="current-budget"
            class="text-brand mt-1 text-lg font-extrabold"
          >
            {{ settings.monthlyBudget.toLocaleString('ko-KR') }}원
          </p>
        </div>
      </section>

      <section class="space-y-2.5">
        <label class="text-ink text-[13px] font-bold">월 예산</label>
        <MoneyInput
          v-model="budget"
          accent
        />
        <div class="flex gap-2">
          <button
            v-for="amount in [50_000, 100_000, 500_000, 1_000_000]"
            :key="amount"
            type="button"
            class="border-line text-ink-muted flex-1 rounded-full border py-2 text-xs font-medium"
            @click="budget += amount"
          >
            +{{ amount / 10_000 }}만원
          </button>
        </div>
      </section>

      <div class="text-ink-muted flex gap-2 text-xs leading-relaxed">
        <IconInfoCircle
          :size="16"
          class="mt-0.5 shrink-0"
        />
        <p>예산을 변경하면 만족도 지도의 지출 부담과 이후 분석 결과에 반영돼요.</p>
      </div>
    </main>

    <footer class="bg-surface shrink-0 px-5 pt-3 pb-8">
      <button
        type="button"
        class="bg-brand text-surface flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold disabled:opacity-40"
        :disabled="budget <= 0"
        @click="save"
      >
        저장하기 <IconArrowRight :size="18" />
      </button>
    </footer>
  </div>
</template>
