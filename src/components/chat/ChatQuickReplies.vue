<script setup lang="ts">
defineProps<{ options: readonly string[] }>()
defineEmits<{ pick: [value: string] }>()
</script>

<template>
  <div
    class="border-line bg-surface ml-10 flex flex-wrap gap-2 rounded-2xl rounded-bl-sm border p-3"
  >
    <button
      v-for="option in options"
      :key="option"
      type="button"
      class="border-line text-ink hover:border-brand hover:text-brand rounded-xl border px-3 py-2 text-sm font-medium"
      @click="$emit('pick', option)"
    >
      {{ option }}
    </button>
  </div>
</template>
