<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconArrowRight, IconCheck, IconTrash } from '@tabler/icons-vue'

import AppTopBar from '@/components/common/AppTopBar.vue'
import GoalDatePicker from '@/components/common/goal-date-picker.vue'
import MoneyInput from '@/components/common/MoneyInput.vue'
import goalCustom from '@/assets/images/onboarding/goal-custom.png'
import goalEmergency from '@/assets/images/onboarding/goal-emergency.png'
import goalIndependence from '@/assets/images/onboarding/goal-independence.png'
import goalTravel from '@/assets/images/onboarding/goal-travel.png'
import { useSettingsStore, type GoalType } from '@/stores/settings'
import { createGoal, deleteGoal, getGoals, updateGoal } from '@/api/service'
import type { Goal } from '@/api/types'
import { ApiError } from '@/api/apiError'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const settings = useSettingsStore()
const userStore = useUserStore()
const goalType = ref<GoalType>(settings.goalType)
const customName = ref(settings.goalType === 'CUSTOM' ? settings.goalName : '')
const amount = ref(settings.goalAmount)
/** 지금까지 모은 금액. `MoneyInput`이 숫자만 받아 0 미만이 될 수 없다. */
const currentAmount = ref(0)
/** 서버에서 읽어 온 실적. 이 값과 같으면 `PUT`에 싣지 않는다 (E-100 · #17 코멘트). */
const savedCurrentAmount = ref(0)
/** 달력이 다루는 `YYYY-MM-DD`. 아직 정하지 않았으면 빈 문자열이다. */
const targetDate = ref('')
/** 서버에서 읽어 온 예정일. 이 값과 같으면 `PUT`에 싣지 않는다 (05 v2.37 · E-114). */
const savedTargetDate = ref('')
const goalId = ref<number | null>(null)
/** `GET /goals`가 준 raw double. `targetAmount <= 0`이면 서버가 null을 준다 (E-83). */
const achievementRate = ref<number | null>(null)
const projectedRate = ref<number | null>(null)
const saving = ref(false)
const saveError = ref('')
const confirmingDelete = ref(false)
const deleted = ref(false)

onMounted(async () => {
  try {
    const [goal] = await getGoals()
    if (!goal) return
    applyGoal(goal)
  } catch (error) {
    saveError.value = await apiErrorMessage(error, '저장된 목표를 불러오지 못했어요.')
  }
})

const goalTypes = [
  { value: 'TRAVEL', label: '여행', image: goalTravel },
  { value: 'EMERGENCY', label: '비상금', image: goalEmergency },
  { value: 'INDEPENDENCE', label: '독립', image: goalIndependence },
  { value: 'CUSTOM', label: '직접 입력', image: goalCustom },
] as const

const canSave = computed(
  () => amount.value > 0 && (goalType.value !== 'CUSTOM' || customName.value.trim()),
)

function applyGoal(goal: Goal) {
  goalId.value = goal.id
  amount.value = goal.targetAmount
  customName.value = goal.name
  targetDate.value = goal.targetDate ?? ''
  savedTargetDate.value = goal.targetDate ?? ''
  currentAmount.value = goal.currentAmount
  savedCurrentAmount.value = goal.currentAmount
  achievementRate.value = goal.achievementRate
  projectedRate.value = goal.projectedRate
}

/** 서버가 raw double을 주므로 반올림은 화면이 한다 (E-83). */
function toPercent(rate: number | null) {
  return rate === null ? null : Math.round(rate * 100)
}

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
      const created = await createGoal({
        name,
        targetAmount: amount.value,
        ...(targetDate.value ? { targetDate: targetDate.value } : {}),
        currentAmount: currentAmount.value,
      })
      goalId.value = created.id
    } else {
      const changedDate = targetDate.value !== savedTargetDate.value ? targetDate.value : ''
      const changedAmount = currentAmount.value !== savedCurrentAmount.value
      await updateGoal(goalId.value, {
        name,
        targetAmount: amount.value,
        ...(changedDate ? { targetDate: changedDate } : {}),
        ...(changedAmount ? { currentAmount: currentAmount.value } : {}),
      })
    }
    savedTargetDate.value = targetDate.value
    savedCurrentAmount.value = currentAmount.value
    settings.updateGoal({ type: goalType.value, name, amount: amount.value })
    await router.push('/me')
  } catch (error) {
    saveError.value = await apiErrorMessage(error, '목표를 저장하지 못했어요. 다시 시도해주세요.')
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (saving.value || goalId.value === null) return
  saving.value = true
  saveError.value = ''
  try {
    await deleteGoal(goalId.value)
    const [goal] = await getGoals()
    confirmingDelete.value = false
    if (goal) {
      applyGoal(goal)
      return
    }
    goalId.value = null
    deleted.value = true
  } catch (error) {
    saveError.value = await apiErrorMessage(error, '목표를 삭제하지 못했어요. 다시 시도해주세요.')
  } finally {
    saving.value = false
  }
}

function startOver() {
  deleted.value = false
  targetDate.value = ''
  savedTargetDate.value = ''
  currentAmount.value = 0
  savedCurrentAmount.value = 0
  achievementRate.value = null
  projectedRate.value = null
}

async function apiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback
  if (error.code === 'UNAUTHORIZED') {
    userStore.signOut()
    await router.push({ name: 'login' })
    return '로그인이 만료됐어요.'
  }
  if (error.code === 'ONBOARDING_REQUIRED') {
    await router.push({ name: 'onboarding' })
    return '먼저 온보딩을 완료해 주세요.'
  }
  if (error.code === 'NOT_FOUND') return '이미 삭제된 목표예요.'
  if (error.code === 'INVALID_INPUT') return '목표 이름과 금액을 다시 확인해 주세요.'
  return fallback
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

    <main
      v-if="deleted"
      class="flex-1 space-y-4 overflow-y-auto px-5 pt-4 pb-6"
    >
      <section class="space-y-1.5">
        <h1 class="text-ink text-[22px] font-bold">등록된 목표가 없어요</h1>
        <p class="text-ink-muted text-sm">
          목표를 지워도 지금까지 채택한 절감 이력은 그대로 남아 있어요.
        </p>
      </section>
      <button
        type="button"
        class="bg-brand text-surface flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold"
        @click="startOver"
      >
        새로 만들기 <IconArrowRight :size="18" />
      </button>
    </main>

    <main
      v-else
      class="flex-1 space-y-5 overflow-y-auto px-5 pt-4 pb-6"
    >
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
        <label class="text-ink text-[13px] font-bold">지금까지 모은 금액</label>
        <MoneyInput v-model="currentAmount" />
      </section>

      <section class="space-y-2">
        <label class="text-ink text-[13px] font-bold">목표 달성 예정일</label>
        <GoalDatePicker v-model="targetDate" />
      </section>

      <section
        v-if="goalId !== null"
        class="border-line space-y-2 rounded-2xl border p-4"
      >
        <p class="text-ink text-[13px] font-bold">달성률</p>
        <p
          v-if="toPercent(achievementRate) === null || toPercent(projectedRate) === null"
          class="text-ink-muted text-sm"
          data-testid="goal-rates"
        >
          목표 금액을 정하면 달성률을 보여드려요.
        </p>
        <div
          v-else
          class="flex items-center gap-3"
          data-testid="goal-rates"
        >
          <span class="flex-1">
            <span class="text-ink-muted block text-xs">지금</span>
            <strong class="text-ink text-xl font-bold">{{ toPercent(achievementRate) }}%</strong>
          </span>
          <IconArrowRight
            :size="16"
            class="text-ink-faint"
          />
          <span class="flex-1">
            <span class="text-ink-muted block text-xs">채택대로 가면</span>
            <strong class="text-brand text-xl font-bold">{{ toPercent(projectedRate) }}%</strong>
          </span>
        </div>
      </section>

      <section
        v-if="goalId !== null"
        class="space-y-2"
      >
        <button
          v-if="!confirmingDelete"
          type="button"
          class="border-line text-ink-muted flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border text-sm font-bold"
          @click="confirmingDelete = true"
        >
          <IconTrash :size="16" /> 목표 삭제
        </button>
        <div
          v-else
          class="border-line space-y-3 rounded-2xl border p-4"
        >
          <p class="text-ink text-sm font-bold">정말 삭제할까요?</p>
          <p class="text-ink-muted text-xs">
            지금까지 채택한 절감 이력은 서버에 그대로 남아요. 목표만 목록에서 사라져요.
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              class="border-line text-ink-muted h-11 flex-1 rounded-xl border text-sm font-bold"
              @click="confirmingDelete = false"
            >
              취소
            </button>
            <button
              type="button"
              class="bg-brand text-surface h-11 flex-1 rounded-xl text-sm font-bold disabled:opacity-40"
              :disabled="saving"
              @click="confirmDelete"
            >
              삭제하기
            </button>
          </div>
        </div>
      </section>
    </main>

    <footer
      v-if="!deleted"
      class="bg-surface shrink-0 px-5 pt-3 pb-8"
    >
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
