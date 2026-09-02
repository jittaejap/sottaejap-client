import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { SatisfactionMap, SatisfactionMapPoint } from '@/api/types'

export const useMapStore = defineStore('map', () => {
  /** `GET /satisfaction-map` 결과 */
  const data = ref<SatisfactionMap | null>(null)

  /** 07 §8 정렬 — ADJUST 먼저, 그 안에서 burdenRatio 내림차순 */
  const sortedPoints = computed<SatisfactionMapPoint[]>(() => {
    const points = data.value?.points ?? []
    return [...points].sort((a, b) => {
      const aAdjust = a.verdict === 'ADJUST' ? 0 : 1
      const bAdjust = b.verdict === 'ADJUST' ? 0 : 1
      return aAdjust - bAdjust || b.burdenRatio - a.burdenRatio
    })
  })

  return { data, sortedPoints }
})
