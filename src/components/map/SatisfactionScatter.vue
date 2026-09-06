<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'

import '@/composables/useEcharts'
import { cssVar } from '@/composables/useCssVar'
import type { SatisfactionMap, SatisfactionMapPoint } from '@/api/types'
import { QUADRANT_COLOR_VAR, QUADRANT_OPACITY, quadrantTone } from '@/components/map/verdictStyle'

const props = defineProps<{
  points: SatisfactionMapPoint[]
  boundaries: SatisfactionMap['boundaries']
  selectedId: number | null
}>()

const emit = defineEmits<{ select: [behaviorId: number] }>()

const plotGridStyle = computed(() => {
  const maxBurden = Math.max(...props.points.map((point) => point.burdenRatio), 0.01) * 1.35
  const xPercent =
    props.boundaries.x === null
      ? 50
      : Math.min(100, Math.max(0, (props.boundaries.x / maxBurden) * 100))
  const topPercent =
    props.boundaries.y === null
      ? 50
      : Math.min(100, Math.max(0, ((1 - props.boundaries.y) / 2) * 100))

  return {
    gridTemplateColumns: xPercent + '% ' + (100 - xPercent) + '%',
    gridTemplateRows: topPercent + '% ' + (100 - topPercent) + '%',
  }
})

function pointColor(point: SatisfactionMapPoint) {
  return cssVar(QUADRANT_COLOR_VAR[quadrantTone(point)])
}

const option = computed(() => {
  const line = cssVar('--color-line')
  const inkMuted = cssVar('--color-ink-muted')
  const awesomeSoft = cssVar('--color-map-awesome-soft')
  const greatSoft = cssVar('--color-map-great-soft')
  const ummSoft = cssVar('--color-map-umm-soft')
  const hmmSoft = cssVar('--color-map-hmm-soft')
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
            opacity: QUADRANT_OPACITY[quadrantTone(p)],
            borderColor: pointColor(p),
            borderWidth: p.behaviorId === props.selectedId ? 6 : 0,
          },
          label: {
            show: true,
            position: 'right',
            distance: 6,
            fontSize: 11,
            fontWeight: 'bold',
            color: quadrantTone(p) === 'pending' ? inkMuted : pointColor(p),
            formatter: `${p.name}(${p.retrospectCount})`,
          },
        })),
        markArea:
          props.boundaries.x !== null && props.boundaries.y !== null
            ? {
                silent: true,
                data: [
                  [
                    {
                      xAxis: 0,
                      yAxis: props.boundaries.y,
                      itemStyle: { color: awesomeSoft },
                    },
                    { xAxis: props.boundaries.x, yAxis: 1 },
                  ],
                  [
                    {
                      xAxis: props.boundaries.x,
                      yAxis: props.boundaries.y,
                      itemStyle: { color: greatSoft },
                    },
                    { xAxis: maxBurden * 1.35, yAxis: 1 },
                  ],
                  [
                    {
                      xAxis: 0,
                      yAxis: -1,
                      itemStyle: { color: ummSoft },
                    },
                    { xAxis: props.boundaries.x, yAxis: props.boundaries.y },
                  ],
                  [
                    {
                      xAxis: props.boundaries.x,
                      yAxis: -1,
                      itemStyle: { color: hmmSoft },
                    },
                    { xAxis: maxBurden * 1.35, yAxis: props.boundaries.y },
                  ],
                ],
              }
            : undefined,
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
  <div class="relative h-72 w-full">
    <div
      class="pointer-events-none absolute inset-[18px] grid overflow-hidden"
      :style="plotGridStyle"
      aria-hidden="true"
    >
      <span class="bg-map-awesome-soft" />
      <span class="bg-map-great-soft" />
      <span class="bg-map-umm-soft" />
      <span class="bg-map-hmm-soft" />
    </div>
    <VChart
      class="relative z-10"
      :option="option"
      autoresize
      @click="onClick"
    />
  </div>
</template>
