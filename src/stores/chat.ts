import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

import type { RetrospectCandidate } from '@/api/types'

export type ChatMode = 'retrospect' | 'analysis' | 'qna'

export type ChatStep =
  | 'menu'
  | 'candidate'
  | 'empty'
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
  const analysisTimelineBreak = ref(0)
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
  /**
   * 회고 채널이 들고 다니는 후보 (05 §2 `GET /retrospects/candidates`).
   * `POST /retrospects/chat`이 상태 없는 프록시라 대화 상태는 화면이 소유한다 (01 E-63 · E-69).
   * 뷰가 다시 마운트돼도 고르던 거래를 잃지 않도록 스토어에 둔다.
   */
  const candidates = ref<RetrospectCandidate[]>([])
  const selectedCandidate = ref<RetrospectCandidate | null>(null)

  function activate(mode: ChatMode) {
    activeMode.value = mode
  }

  function addMessage(mode: ChatMode, entry: ChatEntry) {
    histories[mode].push(entry)
  }

  function reset() {
    activeMode.value = 'retrospect'
    steps.retrospect = 'menu'
    steps.analysis = 'menu'
    steps.qna = 'menu'
    histories.retrospect.splice(0)
    histories.analysis.splice(0)
    histories.qna.splice(0)
    analysisTimelineBreak.value = 0
    candidates.value = []
    selectedCandidate.value = null
  }

  return {
    activeMode,
    analysisTimelineBreak,
    steps,
    histories,
    candidates,
    selectedCandidate,
    activate,
    addMessage,
    reset,
  }
})
