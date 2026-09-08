<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { IconCheck, IconChevronDown } from '@tabler/icons-vue'

defineProps<{
  modelValue: string
  options: readonly { value: string; label: string }[]
  active?: boolean
  label: string
  align?: 'left' | 'right'
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const open = ref(false)
const root = useTemplateRef<HTMLElement>('root')

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
}

function closeOutside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('pointerdown', closeOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOutside))
</script>

<template>
  <div
    ref="root"
    class="relative min-w-0 flex-1"
  >
    <button
      type="button"
      class="flex h-9 w-full items-center justify-center gap-1 truncate rounded-xl border bg-surface px-2 text-xs font-medium"
      :class="active ? 'border-brand text-brand' : 'border-line text-ink-muted'"
      :aria-label="label"
      :aria-expanded="open"
      @click="open = !open"
    >
      {{ options.find((option) => option.value === modelValue)?.label }}
      <IconChevronDown :size="12" />
    </button>
    <div
      v-if="open"
      class="border-line bg-surface absolute top-11 z-30 min-w-max overflow-hidden rounded-xl border p-1 shadow-lg"
      :class="align === 'right' ? 'right-0' : 'left-0'"
      role="listbox"
      :aria-label="label"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        role="option"
        class="text-ink hover:bg-surface-muted flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-xs"
        :class="modelValue === option.value ? 'bg-brand-soft text-brand font-bold' : ''"
        :aria-selected="modelValue === option.value"
        @click="select(option.value)"
      >
        {{ option.label }}
        <IconCheck
          v-if="modelValue === option.value"
          :size="14"
        />
      </button>
    </div>
  </div>
</template>
