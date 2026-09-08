<script setup lang="ts">
import { IconArrowRight } from '@tabler/icons-vue'

withDefaults(defineProps<{ arrow?: boolean; variant?: 'solid' | 'outline' }>(), {
  arrow: false,
  variant: 'solid',
})
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-semibold transition active:opacity-80 disabled:opacity-40"
    :class="
      variant === 'solid'
        ? 'bg-brand text-surface'
        : 'border-brand text-brand border bg-transparent'
    "
  >
    <slot />
    <IconArrowRight
      v-if="arrow"
      :size="20"
    />
  </button>
</template>
