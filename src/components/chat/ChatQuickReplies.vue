<script setup lang="ts">
defineProps<{ options: readonly string[] }>()
defineEmits<{ pick: [value: string] }>()
</script>

<template>
  <div class="ml-[68px] flex flex-wrap gap-2">
    <button
      v-for="option in options"
      :key="option"
      type="button"
      class="border-line bg-surface text-ink-muted hover:border-brand hover:bg-brand-soft hover:text-brand rounded-xl border px-3.5 py-2 text-[13px] font-medium"
      @click="$emit('pick', option)"
    >
      {{ option }}
    </button>
  </div>
</template>
