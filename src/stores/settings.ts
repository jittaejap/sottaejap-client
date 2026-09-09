import { ref } from 'vue'
import { defineStore } from 'pinia'

export type GoalType = 'TRAVEL' | 'EMERGENCY' | 'INDEPENDENCE' | 'CUSTOM'
export type AnalysisSensitivity = 'RELAXED' | 'BALANCED' | 'DETAILED'

export const useSettingsStore = defineStore('settings', () => {
  const monthlyBudget = ref(2_500_000)
  const goalType = ref<GoalType>('TRAVEL')
  const goalName = ref('여행 자금')
  const goalAmount = ref(1_000_000)
  const sensitivity = ref<AnalysisSensitivity | null>('BALANCED')

  function updateBudget(value: number) {
    monthlyBudget.value = value
  }

  function updateGoal(payload: { type: GoalType; name: string; amount: number }) {
    goalType.value = payload.type
    goalName.value = payload.name
    goalAmount.value = payload.amount
  }

  function updateSensitivity(value: AnalysisSensitivity) {
    sensitivity.value = value
  }

  return {
    monthlyBudget,
    goalType,
    goalName,
    goalAmount,
    sensitivity,
    updateBudget,
    updateGoal,
    updateSensitivity,
  }
})
