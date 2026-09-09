import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

import type { RetrospectCandidate, RetrospectReflection } from '@/api/types'

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

/**
 * 아직 아무것도 확인하지 않은 상태.
 * `satisfaction`의 미확정 표기는 05 §2 #11 요청 예시대로 `UNKNOWN`이다 —
 * 서버는 이 값을 보고 다음 단계를 정한다.
 */
function emptyReflection(): RetrospectReflection {
  return { satisfaction: 'UNKNOWN', purpose: null, companion: null, repeatIntent: null }
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
  /** 사용자가 확인한 값만 담는다 — 서버로 보내는 `reflection`이다 (01 E-20 · FR-04-07). */
  const reflection = ref<RetrospectReflection>(emptyReflection())
  /** AI 후보값. 칩을 미리 눌러 두는 데만 쓰고 저장하지 않는다. */
  const suggestedReflection = ref<RetrospectReflection | null>(null)
  /** 03 S11 — `fallback: true` 또는 503 `LLM_UNAVAILABLE`이면 템플릿 모드로 이어간다 (FR-04-15). */
  const templateMode = ref(false)
  /**
   * 지금 회고 중인 거래의 대화가 `histories.retrospect`의 몇 번째부터인지.
   * 화면에는 이전 거래의 대화도 그대로 남기지만, `recentMessages`에는 이 지점 뒤만 싣는다 —
   * 다른 거래의 답이 실리면 AI가 그 값을 후보로 돌려주고 칩이 미리 눌린다 (01 E-20).
   */
  const retrospectHistoryStart = ref(0)

  /** 다른 거래를 회고할 때마다 확정값·후보값·배너를 비운다. */
  function resetReflection() {
    reflection.value = emptyReflection()
    suggestedReflection.value = null
    templateMode.value = false
  }

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
    retrospectHistoryStart.value = 0
    resetReflection()
  }

  return {
    activeMode,
    analysisTimelineBreak,
    steps,
    histories,
    candidates,
    selectedCandidate,
    reflection,
    suggestedReflection,
    templateMode,
    retrospectHistoryStart,
    activate,
    addMessage,
    resetReflection,
    reset,
  }
})
