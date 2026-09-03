<script setup lang="ts">
withDefaults(defineProps<{ role?: 'ai' | 'user' }>(), { role: 'ai' })
</script>

<template>
  <div
    class="flex items-end gap-2"
    :class="role === 'user' ? 'flex-row-reverse' : ''"
  >
    <span
      v-if="role === 'ai'"
      class="bg-surface-muted flex size-8 shrink-0 items-center justify-center rounded-full text-base"
    >
      🐮
    </span>
    <div
      class="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
      :class="
        role === 'user'
          ? 'bg-brand/10 text-ink rounded-br-sm'
          : 'border-line bg-surface text-ink rounded-bl-sm border'
      "
    >
      <slot />
    </div>
  </div>
</template>
