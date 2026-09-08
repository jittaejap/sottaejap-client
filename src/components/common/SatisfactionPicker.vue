<script setup lang="ts">
import { IconMoodSad, IconMoodSmile, IconQuestionMark } from '@tabler/icons-vue'

import type { Satisfaction } from '@/api/enums'

defineProps<{ modelValue: Satisfaction | null }>()
defineEmits<{ 'update:modelValue': [value: Satisfaction] }>()

const options: {
  value: Satisfaction
  label: string
  sublabel: string
  icon: typeof IconMoodSmile
  colorClass: string
  bgClass: string
}[] = [
  {
    value: 'HIGH',
    label: '만족했어요',
    sublabel: '가치 있는 소비였어요',
    icon: IconMoodSmile,
    colorClass: 'text-satisfaction-high',
    bgClass: 'bg-satisfaction-high/10',
  },
  {
    value: 'LOW',
    label: '별로예요',
    sublabel: '후회가 남는 소비였어요',
    icon: IconMoodSad,
    colorClass: 'text-satisfaction-low',
    bgClass: 'bg-satisfaction-low/10',
  },
  {
    value: 'UNKNOWN',
    label: '잘 모르겠어요',
    sublabel: '기억이 잘 나지 않아요',
    icon: IconQuestionMark,
    colorClass: 'text-satisfaction-unknown',
    bgClass: 'bg-satisfaction-unknown/10',
  },
]
</script>

<template>
  <div class="grid grid-cols-3 gap-2">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="flex flex-col items-center gap-2 rounded-2xl border p-3 text-center"
      :class="
        modelValue === opt.value ? ['border-current', opt.colorClass] : 'border-line text-ink'
      "
      @click="$emit('update:modelValue', opt.value)"
    >
      <span
        class="flex size-11 items-center justify-center rounded-full"
        :class="modelValue === opt.value ? opt.bgClass : 'bg-surface-muted'"
      >
        <component
          :is="opt.icon"
          :size="22"
          :class="modelValue === opt.value ? opt.colorClass : 'text-ink-muted'"
        />
      </span>
      <span class="text-sm font-semibold">{{ opt.label }}</span>
      <span class="text-ink-muted text-xs">{{ opt.sublabel }}</span>
    </button>
  </div>
</template>
