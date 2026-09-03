<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ name: string; size?: 'sm' | 'md' }>(), { size: 'md' })

/** 실제 가맹점 로고 이미지가 없어 이니셜 배지로 대체한다. */
const initials = computed(() => (props.name.length <= 3 ? props.name : props.name.slice(0, 2)))
</script>

<template>
  <span
    class="bg-surface-muted text-ink flex shrink-0 items-center justify-center rounded-xl font-bold"
    :class="size === 'sm' ? 'size-9 text-[11px]' : 'size-11 text-sm'"
  >
    {{ initials }}
  </span>
</template>
