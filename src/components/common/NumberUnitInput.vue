<script setup lang="ts">
import { IconX } from '@tabler/icons-vue'

const props = defineProps<{ modelValue: number; unit: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

function onInput(event: Event) {
  const digits = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, '')
  emit('update:modelValue', digits === '' ? 0 : Number(digits))
}
</script>

<template>
  <div class="flex h-[52px] items-center gap-1 rounded-xl border border-brand px-4">
    <input
      type="text"
      inputmode="numeric"
      :value="props.modelValue || ''"
      placeholder="0"
      class="min-w-0 flex-1 text-lg font-bold text-ink outline-none placeholder:text-ink-faint"
      @input="onInput"
    />
    <span class="text-lg font-bold text-ink">{{ unit }}</span>
    <button
      v-if="modelValue > 0"
      type="button"
      class="ml-auto flex size-[18px] items-center justify-center text-ink-faint"
      aria-label="지우기"
      @click="emit('update:modelValue', 0)"
    >
      <IconX :size="18" />
    </button>
  </div>
</template>
