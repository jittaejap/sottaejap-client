<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'

import '@/composables/useEcharts'
import { cssVar } from '@/composables/useCssVar'

const props = defineProps<{ values: number[]; labels: string[] }>()

const peakIndex = computed(() =>
  props.values.reduce((best, v, i) => (v > props.values[best]! ? i : best), 0),
)

const option = computed(() => {
  const brand = cssVar('--color-brand')
  const ink = cssVar('--color-ink')
  const inkMuted = cssVar('--color-ink-muted')
  const line = cssVar('--color-line')
  const surface = cssVar('--color-surface')

  return {
    grid: { left: 36, right: 16, top: 40, bottom: 24 },
    xAxis: {
      type: 'category',
      data: props.labels,
      axisLine: { lineStyle: { color: line } },
      axisTick: { show: false },
      axisLabel: { color: inkMuted, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: line, type: 'dashed' } },
      axisLabel: {
        color: inkMuted,
        fontSize: 10,
        formatter: (v: number) => `${(v / 10_000).toFixed(0)}만`,
      },
    },
    series: [
      {
        type: 'line',
        data: props.values,
        smooth: 0.3,
        symbolSize: 7,
        lineStyle: { color: brand, width: 3 },
        itemStyle: { color: brand },
        markPoint: {
          symbol: 'roundRect',
          symbolSize: [64, 28],
          itemStyle: { color: brand },
          label: {
            color: surface,
            fontSize: 12,
            fontWeight: 'bold',
            formatter: () => `${props.values[peakIndex.value]!.toLocaleString('ko-KR')}원`,
          },
          data: [{ coord: [props.labels[peakIndex.value], props.values[peakIndex.value]] }],
        },
      },
    ],
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: number) => `${v.toLocaleString('ko-KR')}원`,
      textStyle: { color: ink },
    },
  }
})
</script>

<template>
  <!-- vue-echarts가 자체 스타일로 height:100%를 주므로 높이는 감싼 요소가 정한다. -->
  <div class="h-48 w-full">
    <VChart
      :option="option"
      autoresize
    />
  </div>
</template>
