<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconAdjustments,
  IconArrowRight,
  IconBell,
  IconChartBar,
  IconCheck,
  IconSearch,
} from '@tabler/icons-vue'

import AppTopBar from '@/components/common/AppTopBar.vue'
import MoneyInput from '@/components/common/MoneyInput.vue'
import { useSettingsStore, type AnalysisSensitivity } from '@/stores/settings'

const router = useRouter()
const settings = useSettingsStore()
const sensitivity = ref<AnalysisSensitivity | null>(settings.sensitivity)
const lastPreset = ref<AnalysisSensitivity>(settings.sensitivity ?? 'BALANCED')
const customBaseAmount = ref(settings.sensitivity === null ? settings.outlierBaseAmount : 0)

const options = [
  {
    value: 'RELAXED',
    title: '여유 있게',
    desc: '정말 큰 지출만 알려드려요',
    amount: '15만원 이상',
    baseAmount: 150_000,
    icon: IconChartBar,
  },
  {
    value: 'BALANCED',
    title: '균형 있게',
    desc: '평소와 다른 지출을 알려드려요',
    amount: '10만원 이상',
    baseAmount: 100_000,
    icon: IconBell,
  },
  {
    value: 'DETAILED',
    title: '꼼꼼하게',
    desc: '작은 변화도 알려드려요',
    amount: '5만원 이상',
    baseAmount: 50_000,
    icon: IconSearch,
  },
] as const

const selectedPreset = computed(() => options.find((option) => option.value === sensitivity.value))
const effectiveBaseAmount = computed(
  () => customBaseAmount.value || selectedPreset.value?.baseAmount || 0,
)
const canSave = computed(() => effectiveBaseAmount.value > 0)

function selectPreset(value: AnalysisSensitivity) {
  lastPreset.value = value
  sensitivity.value = value
  customBaseAmount.value = 0
}

function selectCustomAmount(value: number) {
  customBaseAmount.value = value
  sensitivity.value = value > 0 ? null : lastPreset.value
}

function save() {
  settings.updateAnalysisSettings(sensitivity.value, effectiveBaseAmount.value)
  void router.push('/me')
}
</script>

<template>
  <div class="flex h-full flex-col">
    <AppTopBar
      title="소비 분석 민감도"
      back
      bell
      bell-dot
    />

    <main class="flex-1 space-y-6 overflow-y-auto px-5 pt-5 pb-6">
      <section class="space-y-2">
        <h1 class="text-ink text-[22px] leading-[1.3] font-bold">
          소비 분석 기준을<br />설정해 주세요
        </h1>
        <p class="text-ink-muted text-sm">
          평소와 다른 지출을 어느 정도부터 알려드릴지 선택해 주세요.
        </p>
      </section>

      <section class="border-brand bg-brand-soft rounded-2xl border p-4">
        <div class="flex items-center gap-2">
          <span class="bg-brand text-surface flex size-8 items-center justify-center rounded-full">
            <IconAdjustments :size="17" />
          </span>
          <span class="text-brand text-xs font-bold">AI 추천</span>
        </div>
        <p class="text-ink mt-3 text-sm font-bold">균형 있게 분석하는 기준을 추천해요.</p>
        <p class="text-ink-muted mt-1 text-xs">
          평균적인 소비 변화는 놓치지 않으면서 불필요한 알림을 줄여줘요.
        </p>
      </section>

      <section class="space-y-2.5">
        <p class="text-ink text-[13px] font-bold">어느 정도 차이부터 알려드릴까요?</p>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            class="relative flex h-[119px] flex-col items-center rounded-xl border px-2 py-3 text-center"
            :class="sensitivity === option.value ? 'border-2 border-brand' : 'border-line'"
            @click="selectPreset(option.value)"
          >
            <span
              v-if="sensitivity === option.value"
              class="bg-brand text-surface absolute top-2 right-2 flex size-3.5 items-center justify-center rounded-full"
            >
              <IconCheck :size="8" />
            </span>
            <component
              :is="option.icon"
              :size="25"
              class="mb-2"
              :class="sensitivity === option.value ? 'text-brand' : 'text-ink-faint'"
            />
            <strong class="text-ink text-xs">{{ option.title }}</strong>
            <span class="text-ink-faint mt-0.5 text-[9px] leading-tight">{{ option.desc }}</span>
            <span
              class="mt-auto rounded-md px-2 py-1 text-[9px]"
              :class="
                sensitivity === option.value
                  ? 'bg-brand-soft text-brand'
                  : 'bg-surface-muted text-ink-faint'
              "
            >
              {{ option.amount }}
            </span>
          </button>
        </div>
      </section>

      <section class="space-y-2.5">
        <label class="text-ink text-[13px] font-bold">기준 금액 직접 설정</label>
        <MoneyInput
          :model-value="customBaseAmount"
          accent
          @update:model-value="selectCustomAmount"
        />
        <div class="flex gap-2">
          <button
            v-for="amount in [50_000, 100_000, 500_000, 1_000_000]"
            :key="amount"
            type="button"
            class="border-line text-ink-muted flex-1 rounded-full border py-2 text-xs font-medium"
            @click="selectCustomAmount(customBaseAmount + amount)"
          >
            +{{ amount / 10_000 }}만원
          </button>
        </div>
      </section>
    </main>

    <footer class="bg-surface shrink-0 px-5 pt-3 pb-8">
      <button
        type="button"
        class="bg-brand text-surface flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold"
        :disabled="!canSave"
        @click="save"
      >
        저장하기 <IconArrowRight :size="18" />
      </button>
    </footer>
  </div>
</template>
