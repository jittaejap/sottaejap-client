<script setup lang="ts">
/**
 * `suggested`는 AI가 돌려준 후보값의 라벨이다 (05 §2 #11 응답 `reflection`).
 * 미리 눌러 보일 뿐이고, 사용자가 실제로 눌러야 확정값이 된다 (01 E-20 · FR-04-07).
 */
defineProps<{ options: readonly string[]; suggested?: string }>()
defineEmits<{ pick: [value: string] }>()
</script>

<template>
  <div class="ml-[68px] flex flex-wrap gap-2">
    <button
      v-for="option in options"
      :key="option"
      type="button"
      class="hover:border-brand hover:bg-brand-soft hover:text-brand rounded-xl border px-3.5 py-2 text-[13px] font-medium"
      :class="
        option === suggested
          ? 'border-brand bg-brand-soft text-brand'
          : 'border-line bg-surface text-ink-muted'
      "
      :aria-pressed="option === suggested"
      @click="$emit('pick', option)"
    >
      {{ option }}
    </button>
  </div>
</template>
