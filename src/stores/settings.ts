import { ref } from 'vue'
import { defineStore } from 'pinia'

export type GoalType = 'TRAVEL' | 'EMERGENCY' | 'INDEPENDENCE' | 'CUSTOM'
export type AnalysisSensitivity = 'RELAXED' | 'BALANCED' | 'DETAILED'

export const useSettingsStore = defineStore('settings', () => {
  const monthlyBudget = ref(2_500_000)
  const goalType = ref<GoalType>('TRAVEL')
  const goalName = ref('여행 자금')
  const goalAmount = ref(1_000_000)
  const goalPeriod = ref(12)
  const sensitivity = ref<AnalysisSensitivity | null>('BALANCED')
  const outlierBaseAmount = ref(100_000)

  function updateBudget(value: number) {
    monthlyBudget.value = value
  }

  function updateGoal(payload: { type: GoalType; name: string; amount: number; period: number }) {
    goalType.value = payload.type
    goalName.value = payload.name
    goalAmount.value = payload.amount
    goalPeriod.value = payload.period
  }

  function updateSensitivity(value: AnalysisSensitivity) {
    sensitivity.value = value
  }
  function updateAnalysisSettings(value: AnalysisSensitivity | null, baseAmount: number) {
    sensitivity.value = value
    outlierBaseAmount.value = baseAmount
  }

  return {
    monthlyBudget,
    goalType,
    goalName,
    goalAmount,
    goalPeriod,
    sensitivity,
    outlierBaseAmount,
    updateBudget,
    updateGoal,
    updateSensitivity,
    updateAnalysisSettings,
  }
})
