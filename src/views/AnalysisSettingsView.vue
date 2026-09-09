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
import { updateSettings } from '@/api/service'
import type { AnalysisSensitivity } from '@/stores/settings'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const options = [
  {
    value: 'RELAXED',
    title: '여유 있게',
    desc: '정말 큰 지출만 알려드려요',
    amount: '15만원 이상',
    threshold: 3,
    baseAmount: 150_000,
    icon: IconChartBar,
  },
  {
    value: 'BALANCED',
    title: '균형 있게',
    desc: '평소와 다른 지출을 알려드려요',
    amount: '10만원 이상',
    threshold: 2,
    baseAmount: 100_000,
    icon: IconBell,
  },
  {
    value: 'DETAILED',
    title: '꼼꼼하게',
    desc: '작은 변화도 알려드려요',
    amount: '5만원 이상',
    threshold: 1.5,
    baseAmount: 50_000,
    icon: IconSearch,
  },
] as const

// 서버가 정본이다. 배수(`outlierThreshold`)로 프리셋을 되찾고, 금액(`outlierBaseAmount`)은 따로 읽는다.
// 배수가 프리셋 셋 중 어느 것도 아니면 카드를 하나도 켜지 않는다.
const initialPreset =
  options.find((option) => option.threshold === userStore.me?.outlierThreshold)?.value ?? null
/** 서버가 준 기준 금액. 정하지 않았으면 `null`이고, 화면은 그것을 "직접 설정 안 함"으로 그린다 (E-115). */
const initialBaseAmount = userStore.me?.outlierBaseAmount ?? null

const sensitivity = ref<AnalysisSensitivity | null>(initialPreset)
// `MoneyInput`은 숫자만 받으므로 미설정을 0으로 들고 있다. 0은 화면 표시일 뿐 서버로 보내지 않는다.
const customBaseAmount = ref(initialBaseAmount ?? 0)

const presetChanged = computed(() => sensitivity.value !== initialPreset)
const amountChanged = computed(() => customBaseAmount.value !== (initialBaseAmount ?? 0))
/** 바꾼 것이 없으면 보낼 필드가 없다 — 넷이 전부 빈 요청은 서버가 400으로 돌려준다 (E-115 ③). */
const canSave = computed(
  () => presetChanged.value || (amountChanged.value && customBaseAmount.value > 0),
)

function selectPreset(value: AnalysisSensitivity) {
  sensitivity.value = value
  customBaseAmount.value = options.find((option) => option.value === value)?.baseAmount ?? 0
}

/** 금액만 바꾼다. 프리셋(배수)은 그대로 둔다 — 두 값은 서로 다른 규칙에 쓰인다 (E-115). */
function selectCustomAmount(value: number) {
  customBaseAmount.value = value
}

async function save() {
  const payload: { outlierThreshold?: number; outlierBaseAmount?: number } = {}
  if (presetChanged.value) {
    payload.outlierThreshold = options.find(
      (option) => option.value === sensitivity.value,
    )?.threshold
  }
  if (amountChanged.value && customBaseAmount.value > 0) {
    payload.outlierBaseAmount = customBaseAmount.value
  }
  if (payload.outlierThreshold !== undefined || payload.outlierBaseAmount !== undefined) {
    userStore.replaceMe(await updateSettings(payload))
  }
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
          <span class="text-brand text-xs font-bold">추천 기준</span>
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
        <p
          v-if="customBaseAmount === 0"
          class="text-ink-faint text-xs"
        >
          직접 설정 안 함 — 월 예산 기준으로 큰 금액을 판단해요.
        </p>
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
