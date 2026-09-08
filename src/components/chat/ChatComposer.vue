<script setup lang="ts">
import { ref } from 'vue'
import { IconArrowUp, IconChartBar, IconPencil, IconQuestionMark } from '@tabler/icons-vue'

withDefaults(
  defineProps<{
    shortcuts?: boolean
    activeShortcut?: 'retrospect' | 'analysis' | 'qna'
  }>(),
  { shortcuts: true, activeShortcut: 'retrospect' },
)

const emit = defineEmits<{
  send: [text: string]
  shortcut: [key: 'retrospect' | 'analysis' | 'qna']
}>()

const draft = ref('')

function send() {
  const text = draft.value.trim()
  if (text === '') return
  emit('send', text)
  draft.value = ''
}
</script>

<template>
  <div class="border-line bg-surface shrink-0 space-y-2 border-t px-4 pt-3 pb-2">
    <div
      v-if="shortcuts"
      class="flex gap-2"
    >
      <button
        type="button"
        class="flex flex-1 items-center justify-center gap-1 rounded-full border py-2 text-[11px] font-semibold"
        :class="
          activeShortcut === 'retrospect'
            ? 'border-brand bg-brand-soft text-brand'
            : 'border-line text-ink'
        "
        :aria-pressed="activeShortcut === 'retrospect'"
        @click="emit('shortcut', 'retrospect')"
      >
        <IconPencil
          :size="14"
          class="text-brand"
        />
        회고 등록
      </button>
      <button
        type="button"
        class="flex flex-1 items-center justify-center gap-1 rounded-full border py-2 text-[11px] font-semibold"
        :class="
          activeShortcut === 'analysis'
            ? 'border-brand bg-brand-soft text-brand'
            : 'border-line text-ink'
        "
        :aria-pressed="activeShortcut === 'analysis'"
        @click="emit('shortcut', 'analysis')"
      >
        <IconChartBar
          :size="14"
          class="text-brand"
        />
        소비 분석
      </button>
      <button
        type="button"
        class="flex flex-1 items-center justify-center gap-1 rounded-full border py-2 text-[11px] font-semibold"
        :class="
          activeShortcut === 'qna'
            ? 'border-brand bg-brand-soft text-brand'
            : 'border-line text-ink'
        "
        :aria-pressed="activeShortcut === 'qna'"
        @click="emit('shortcut', 'qna')"
      >
        <IconQuestionMark
          :size="14"
          class="text-brand"
        />
        금융 Q&A
      </button>
    </div>
    <div
      class="border-line bg-surface flex items-center gap-2 rounded-full border py-1.5 pr-1.5 pl-4"
    >
      <input
        v-model="draft"
        type="text"
        placeholder="메시지를 입력하세요..."
        class="text-ink placeholder:text-ink-faint flex-1 bg-transparent text-sm outline-none"
        @keyup.enter="send"
      />
      <button
        type="button"
        class="bg-brand text-surface flex size-8 shrink-0 items-center justify-center rounded-full"
        aria-label="보내기"
        @click="send"
      >
        <IconArrowUp :size="16" />
      </button>
    </div>
  </div>
</template>
