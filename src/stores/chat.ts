import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export type ChatMode = 'retrospect' | 'analysis' | 'qna'

export type ChatStep =
  | 'menu'
  | 'candidate'
  | 'pick'
  | 'qaSatisfaction'
  | 'qaPurpose'
  | 'qaCompanion'
  | 'qaRepeat'
  | 'wrapup'
  | 'improvement'
  | 'allocate'
  | 'analysis'
  | 'qna'

export interface ChatEntry {
  role: 'ai' | 'user'
  text: string
  avatar?: string
}

export const useChatStore = defineStore('chat', () => {
  const activeMode = ref<ChatMode>('retrospect')
  const steps = reactive<Record<ChatMode, ChatStep>>({
    retrospect: 'menu',
    analysis: 'menu',
    qna: 'menu',
  })
  const histories = reactive<Record<ChatMode, ChatEntry[]>>({
    retrospect: [],
    analysis: [],
    qna: [],
  })

  function activate(mode: ChatMode) {
    activeMode.value = mode
  }

  function addMessage(mode: ChatMode, entry: ChatEntry) {
    histories[mode].push(entry)
  }

  return { activeMode, steps, histories, activate, addMessage }
})
