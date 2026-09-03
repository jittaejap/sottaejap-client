<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'

import '@/composables/useEcharts'
import { cssVar } from '@/composables/useCssVar'
import type { SatisfactionMap, SatisfactionMapPoint } from '@/api/types'
import { VERDICT_COLOR_VAR, VERDICT_OPACITY, verdictTone } from '@/components/map/verdictStyle'

const props = defineProps<{
  points: SatisfactionMapPoint[]
  boundaries: SatisfactionMap['boundaries']
  selectedId: number | null
}>()

const emit = defineEmits<{ select: [behaviorId: number] }>()

function pointColor(point: SatisfactionMapPoint) {
  return cssVar(VERDICT_COLOR_VAR[verdictTone(point)])
}

const option = computed(() => {
  const line = cssVar('--color-line')
  const inkMuted = cssVar('--color-ink-muted')
  const maxBurden = Math.max(...props.points.map((p) => p.burdenRatio), 0.01)

  const markLineData: { xAxis?: number; yAxis?: number }[] = []
  if (props.boundaries.x !== null) markLineData.push({ xAxis: props.boundaries.x })
  if (props.boundaries.y !== null) markLineData.push({ yAxis: props.boundaries.y })

  return {
    grid: { left: 18, right: 18, top: 18, bottom: 18 },
    xAxis: {
      type: 'value',
      min: 0,
      max: maxBurden * 1.35,
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
    },
    yAxis: {
      type: 'value',
      min: -1,
      max: 1,
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
    },
    series: [
      {
        type: 'scatter',
        symbolSize: (_: unknown, params: { data: { selected: boolean } }) =>
          params.data.selected ? 22 : 14,
        data: props.points.map((p) => ({
          value: [p.burdenRatio, p.adjustedSatisfaction],
          name: p.name,
          behaviorId: p.behaviorId,
          selected: p.behaviorId === props.selectedId,
          itemStyle: {
            color: pointColor(p),
            opacity: VERDICT_OPACITY[verdictTone(p)],
            borderColor: pointColor(p),
            borderWidth: p.behaviorId === props.selectedId ? 6 : 0,
          },
          label: {
            show: true,
            position: 'right',
            distance: 6,
            fontSize: 11,
            fontWeight: 'bold',
            color: verdictTone(p) === 'pending' ? inkMuted : pointColor(p),
            formatter: `${p.name}(${p.retrospectCount})`,
          },
        })),
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: line, type: 'dashed' },
          label: { show: false },
          data: markLineData,
        },
      },
    ],
  }
})

function onClick(params: unknown) {
  const data = (params as { data?: { behaviorId?: number } }).data
  if (typeof data?.behaviorId === 'number') emit('select', data.behaviorId)
}
</script>

<template>
  <!-- vue-echarts가 자체 스타일로 height:100%를 주므로 높이는 감싼 요소가 정한다. -->
  <div class="h-72 w-full">
    <VChart
      :option="option"
      autoresize
      @click="onClick"
    />
  </div>
</template>
