<script setup lang="ts">
import { computed } from 'vue'
import { IconX } from '@tabler/icons-vue'

const props = defineProps<{ modelValue: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const formatted = computed(() =>
  props.modelValue > 0 ? props.modelValue.toLocaleString('ko-KR') : '',
)

function onInput(event: Event) {
  const digits = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, '')
  emit('update:modelValue', digits === '' ? 0 : Number(digits))
}
</script>

<template>
  <div class="border-line bg-surface flex items-center gap-2 rounded-2xl border px-4 py-3.5">
    <span class="text-ink text-lg font-semibold">₩</span>
    <input
      type="text"
      inputmode="numeric"
      :value="formatted"
      placeholder="0"
      class="text-ink placeholder:text-ink-faint flex-1 text-lg font-semibold outline-none"
      @input="onInput"
    />
    <button
      v-if="modelValue > 0"
      type="button"
      class="text-ink-muted flex size-6 items-center justify-center"
      aria-label="지우기"
      @click="emit('update:modelValue', 0)"
    >
      <IconX :size="16" />
    </button>
  </div>
</template>
