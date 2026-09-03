<script setup lang="ts">
import { ref } from 'vue'
import { IconChartBar, IconPencil, IconQuestionMark, IconSend } from '@tabler/icons-vue'

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
  <div class="border-line bg-surface shrink-0 space-y-2 border-t px-4 py-3">
    <div class="flex gap-2">
      <button
        type="button"
        class="border-line text-ink flex flex-1 items-center justify-center gap-1 rounded-xl border py-2 text-xs font-medium"
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
        class="border-line text-ink flex flex-1 items-center justify-center gap-1 rounded-xl border py-2 text-xs font-medium"
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
        class="border-line text-ink flex flex-1 items-center justify-center gap-1 rounded-xl border py-2 text-xs font-medium"
        @click="emit('shortcut', 'qna')"
      >
        <IconQuestionMark
          :size="14"
          class="text-brand"
        />
        금융 Q&A
      </button>
    </div>
    <div class="bg-surface-muted flex items-center gap-2 rounded-full py-1.5 pr-1.5 pl-4">
      <input
        v-model="draft"
        type="text"
        placeholder="AI에게 메시지를 입력하세요..."
        class="text-ink placeholder:text-ink-faint flex-1 bg-transparent text-sm outline-none"
        @keyup.enter="send"
      />
      <button
        type="button"
        class="bg-brand text-surface flex size-9 shrink-0 items-center justify-center rounded-full"
        aria-label="보내기"
        @click="send"
      >
        <IconSend :size="17" />
      </button>
    </div>
  </div>
</template>
