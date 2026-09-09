<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconArrowRight, IconCheck } from '@tabler/icons-vue'

import AppTopBar from '@/components/common/AppTopBar.vue'
import MoneyInput from '@/components/common/MoneyInput.vue'
import NumberUnitInput from '@/components/common/NumberUnitInput.vue'
import goalCustom from '@/assets/images/onboarding/goal-custom.png'
import goalEmergency from '@/assets/images/onboarding/goal-emergency.png'
import goalIndependence from '@/assets/images/onboarding/goal-independence.png'
import goalTravel from '@/assets/images/onboarding/goal-travel.png'
import { useSettingsStore, type GoalType } from '@/stores/settings'
import { createGoal, getGoals, updateGoal } from '@/api/service'

const router = useRouter()
const settings = useSettingsStore()
const goalType = ref<GoalType>(settings.goalType)
const customName = ref(settings.goalType === 'CUSTOM' ? settings.goalName : '')
const amount = ref(settings.goalAmount)
const period = ref(settings.goalPeriod)
const goalId = ref<number | null>(null)
const currentAmount = ref(0)
const saving = ref(false)
const saveError = ref('')

onMounted(async () => {
  try {
    const [goal] = await getGoals()
    if (!goal) return
    goalId.value = goal.id
    currentAmount.value = goal.currentAmount
    amount.value = goal.targetAmount
    customName.value = goal.name
    goalType.value = 'CUSTOM'
  } catch {
    saveError.value = '저장된 목표를 불러오지 못했어요.'
  }
})

const goalTypes = [
  { value: 'TRAVEL', label: '여행', image: goalTravel },
  { value: 'EMERGENCY', label: '비상금', image: goalEmergency },
  { value: 'INDEPENDENCE', label: '독립', image: goalIndependence },
  { value: 'CUSTOM', label: '직접 입력', image: goalCustom },
] as const

const canSave = computed(
  () =>
    amount.value > 0 &&
    period.value > 0 &&
    (goalType.value !== 'CUSTOM' || customName.value.trim()),
)

function onGoalNameInput(event: Event) {
  const input = event.target as HTMLInputElement
  const sanitized = Array.from(input.value.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s]/g, ''))
    .slice(0, 9)
    .join('')
  customName.value = sanitized
  input.value = sanitized
}

async function save() {
  if (saving.value) return
  const selected = goalTypes.find((goal) => goal.value === goalType.value)!
  const name = goalType.value === 'CUSTOM' ? customName.value.trim() : `${selected.label} 자금`
  saving.value = true
  saveError.value = ''
  try {
    if (goalId.value === null) {
      const created = await createGoal({ name, targetAmount: amount.value, currentAmount: 0 })
      goalId.value = created.id
    } else {
      await updateGoal(goalId.value, {
        name,
        targetAmount: amount.value,
        currentAmount: currentAmount.value,
      })
    }
    settings.updateGoal({ type: goalType.value, name, amount: amount.value, period: period.value })
    await router.push('/me')
  } catch {
    saveError.value = '목표를 저장하지 못했어요. 다시 시도해주세요.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <AppTopBar
      title="목표 자금 관리"
      back
      bell
      bell-dot
    />

    <main class="flex-1 space-y-5 overflow-y-auto px-5 pt-4 pb-6">
      <section class="space-y-1.5">
        <h1 class="text-ink text-[22px] font-bold">저축 목표를 설정해 주세요</h1>
        <p class="text-ink-muted text-sm">목표와 기간에 맞춰 절감액 달성 과정을 보여드려요.</p>
      </section>

      <section class="grid grid-cols-2 gap-3">
        <button
          v-for="goal in goalTypes"
          :key="goal.value"
          type="button"
          class="relative flex h-[132px] flex-col items-center justify-center gap-1 rounded-2xl border p-3"
          :class="goalType === goal.value ? 'border-2 border-brand' : 'border-line'"
          @click="goalType = goal.value"
        >
          <span
            v-if="goalType === goal.value"
            class="bg-brand text-surface absolute top-2.5 right-2.5 flex size-[18px] items-center justify-center rounded-full"
          >
            <IconCheck
              :size="11"
              :stroke-width="3"
            />
          </span>
          <img
            :src="goal.image"
            alt=""
            class="size-[78px] object-contain"
          />
          <span class="text-ink text-sm font-bold">{{ goal.label }}</span>
        </button>
      </section>

      <section
        v-if="goalType === 'CUSTOM'"
        class="space-y-2"
      >
        <label
          for="settings-goal-name"
          class="text-ink text-[13px] font-bold"
          >목표 이름</label
        >
        <input
          id="settings-goal-name"
          :value="customName"
          type="text"
          maxlength="9"
          placeholder="예: 자동차 구매"
          class="border-brand text-ink placeholder:text-ink-faint h-[52px] w-full rounded-xl border px-4 text-lg font-bold outline-none placeholder:text-sm placeholder:font-normal"
          @input="onGoalNameInput"
        />
      </section>

      <section class="space-y-2">
        <label class="text-ink text-[13px] font-bold">목표 금액</label>
        <MoneyInput
          v-model="amount"
          accent
        />
        <div class="flex gap-2">
          <button
            v-for="value in [100_000, 500_000, 1_000_000]"
            :key="value"
            type="button"
            class="border-line text-ink-muted rounded-full border px-3 py-2 text-xs font-medium"
            @click="amount += value"
          >
            +{{ value / 10_000 }}만
          </button>
        </div>
      </section>

      <section class="space-y-2">
        <label class="text-ink text-[13px] font-bold">목표 기간</label>
        <NumberUnitInput
          v-model="period"
          unit="개월"
        />
        <div class="flex gap-2">
          <button
            v-for="value in [3, 6, 12]"
            :key="value"
            type="button"
            class="border-line text-ink-muted rounded-full border px-3 py-2 text-xs font-medium"
            @click="period += value"
          >
            +{{ value }}개월
          </button>
        </div>
      </section>
    </main>

    <footer class="bg-surface shrink-0 px-5 pt-3 pb-8">
      <p
        v-if="saveError"
        class="text-brand mb-2 text-xs"
      >
        {{ saveError }}
      </p>
      <button
        type="button"
        class="bg-brand text-surface flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold disabled:opacity-40"
        :disabled="!canSave || saving"
        @click="save"
      >
        저장하기 <IconArrowRight :size="18" />
      </button>
    </footer>
  </div>
</template>
