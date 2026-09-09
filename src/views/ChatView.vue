<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IconBulb,
  IconBurger,
  IconCar,
  IconChartBar,
  IconChartPie,
  IconCheck,
  IconChevronDown,
  IconAlertTriangle,
  IconChevronRight,
  IconChevronUp,
  IconClock,
  IconCoffee,
  IconGift,
  IconMoonStars,
  IconMoped,
  IconRepeat,
  IconSearch,
  IconShieldCheck,
  IconShieldLock,
  IconTargetArrow,
} from '@tabler/icons-vue'

import AppBottomNav from '@/components/common/AppBottomNav.vue'
import AppTopBar from '@/components/common/AppTopBar.vue'
import MerchantBadge from '@/components/common/MerchantBadge.vue'
import PrimaryButton from '@/components/common/PrimaryButton.vue'
import { PRESCRIPTION_LABEL } from '@/components/map/verdictStyle'
import ChatBubble from '@/components/chat/ChatBubble.vue'
import ChatComposer from '@/components/chat/ChatComposer.vue'
import ChatQuickReplies from '@/components/chat/ChatQuickReplies.vue'
import {
  COMPANION_OPTIONS,
  PURPOSE_OPTIONS,
  REPEAT_OPTIONS,
  SATISFACTION_OPTIONS,
  type TagOption,
  tagLabels,
  tagValue,
} from '@/components/chat/tagOptions'
import aiAvatarImage from '@/assets/images/ai/01_main_wave_hat.png'
import aiSmallAvatarImage from '@/assets/images/ai/02_wave_small_hat.png'
import retrospectImage from '@/assets/images/ai/03_tablet_chat_hat.png'
import analysisImage from '@/assets/images/ai/09_search_hat.png'
import qnaImage from '@/assets/images/ai/06_idea_hat.png'
import happyAvatar from '@/assets/images/ai/04_happy_cheeks_hat.png'
import cheerAvatar from '@/assets/images/ai/07_cheer_hat.png'
import thinkingAvatar from '@/assets/images/ai/05_thinking_hat.png'
import searchAvatar from '@/assets/images/ai/09_search_hat.png'
import { useChatStore, type ChatStep } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { ApiError } from '@/api/apiError'
import {
  adoptSuggestion,
  askFinance,
  chatRetrospect,
  getAnalysis,
  getGoals,
  getRetrospectCandidates,
  getSuggestions,
  rejectSuggestionById,
  saveRetrospect,
} from '@/api/service'
import type { ReflectionStep } from '@/api/enums'
import type {
  Analysis,
  Goal,
  RetrospectChatMessage,
  RetrospectChatResult,
  Suggestion,
} from '@/api/types'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const userStore = useUserStore()

if (route.query.step === 'improvement') {
  chatStore.activate('analysis')
  chatStore.steps.analysis = 'improvement'
} else if (route.query.mode === 'retrospect') {
  chatStore.activate('retrospect')
}

const activeMode = computed(() => chatStore.activeMode)
const step = computed<ChatStep>({
  get: () => chatStore.steps[activeMode.value],
  set: (value) => {
    chatStore.steps[activeMode.value] = value
  },
})
const history = computed(() => chatStore.histories[activeMode.value])
const thread = useTemplateRef<HTMLElement>('thread')

const activeAvatar = computed(() => {
  if (step.value === 'candidate' || step.value === 'pick' || step.value === 'improvement')
    return searchAvatar
  if (step.value === 'wrapup') return happyAvatar
  if (step.value === 'analysis') return qnaImage
  if (step.value.startsWith('qa')) return thinkingAvatar
  return aiSmallAvatarImage
})

function say(role: 'ai' | 'user', text: string, avatar?: string) {
  chatStore.addMessage(activeMode.value, {
    role,
    text,
    avatar: role === 'ai' ? avatar : undefined,
  })
}

watch(
  [history, step],
  () => {
    void nextTick(() => {
      if (thread.value) thread.value.scrollTop = thread.value.scrollHeight
    })
  },
  { deep: true },
)

/** 채팅 회고 진입은 오늘 포함 최근 3일이다 — 05 §2 `rules.chat-window-days` = 3 (01 E-48). 기준 시간대는 KST다. */
const CHAT_WINDOW_DAYS = 3
/** 3일 창의 후보를 한 번에 받는다. 05 §2 `limit` 상한은 100이다. */
const CANDIDATE_LIMIT = 20
const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/** 브라우저 시간대와 무관하게 KST 달력 날짜(`YYYY-MM-DD`)를 얻는다. */
function kstDateIso(daysAgo: number) {
  const shifted = new Date(Date.now() + KST_OFFSET_MS - daysAgo * 24 * 60 * 60 * 1000)
  return shifted.toISOString().slice(0, 10)
}

/**
 * 서버 시각은 ISO 8601 오프셋 문자열이다 (AGENTS.md).
 * 숫자 배열처럼 다른 모양으로 오면 서버 버그이므로 파싱으로 덮지 않고 받은 값을 그대로 보여 준다.
 */
function formatOccurredAt(occurredAt: string) {
  const parsed = new Date(occurredAt)
  if (Number.isNaN(parsed.getTime())) return String(occurredAt)
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short' }).format(parsed)
}

const candidates = computed(() => chatStore.candidates)
const selected = computed(() => chatStore.selectedCandidate)
const search = ref('')
const nightOnly = ref(false)
const pickedId = ref<number | null>(null)

const filtered = computed(() =>
  candidates.value.filter((c) => {
    const matchesText =
      search.value === '' || c.merchant.includes(search.value) || c.category.includes(search.value)
    return matchesText && (!nightOnly.value || c.timeSlot === 'NIGHT')
  }),
)

/** 05 §0 `reflectionStep` 6종과 화면 단계의 1:1 매핑 (01 E-69). */
const CHAT_STEP_BY_REFLECTION_STEP: Record<ReflectionStep, ChatStep> = {
  INTRO: 'candidate',
  SATISFACTION: 'qaSatisfaction',
  PURPOSE: 'qaPurpose',
  COMPANION: 'qaCompanion',
  REPEAT: 'qaRepeat',
  CONFIRM: 'wrapup',
}

/** 위 매핑 하나만 보고 되돌린다 — 표를 둘로 나누면 언젠가 어긋난다. */
function reflectionStepOf(chatStep: ChatStep): ReflectionStep {
  const found = (Object.keys(CHAT_STEP_BY_REFLECTION_STEP) as ReflectionStep[]).find(
    (key) => CHAT_STEP_BY_REFLECTION_STEP[key] === chatStep,
  )
  return found ?? 'INTRO'
}

/** 서버는 최근 6건만 AI에 전달한다 (01 E-87). */
const RECENT_MESSAGE_LIMIT = 6
/** `content` 상한. 길이는 **코드 포인트**로 센다 (01 E-110). */
const CONTENT_LIMIT = { user: 500, assistant: 2_000 } as const

/**
 * 05 §2 #11 `recentMessages` — 오름차순(오래된 → 최신) · 보내기 전 마지막 6건.
 * `ai`는 `assistant`로 바꾸고 빈 내용은 뺀다. 어기면 400 `INVALID_INPUT`이고 서버는 AI를 부르지 않는다.
 * 지금 회고 중인 거래의 대화만 싣는다 — 서버는 이 이력으로 `task_context`를 만든다.
 */
function recentMessages(): RetrospectChatMessage[] {
  return chatStore.histories.retrospect
    .slice(chatStore.retrospectHistoryStart)
    .map((entry) => {
      const role = entry.role === 'ai' ? ('assistant' as const) : ('user' as const)
      return { role, content: [...entry.text.trim()].slice(0, CONTENT_LIMIT[role]).join('') }
    })
    .filter((message) => message.content.length > 0)
    .slice(-RECENT_MESSAGE_LIMIT)
}

const purposeOptions = tagLabels(PURPOSE_OPTIONS)
const companionOptions = tagLabels(COMPANION_OPTIONS)
const satisfactionOptions = tagLabels(SATISFACTION_OPTIONS)
const repeatOptions = tagLabels(REPEAT_OPTIONS)

function labelOf<V>(options: readonly TagOption<V>[], value: V) {
  return options.find((option) => option.value === value)?.label
}

/**
 * 이번 단계에서 미리 눌러 둘 칩.
 * 서버는 AI가 못 뽑은 항목에 요청의 확정값을 그대로 돌려주므로(05 §2 #11),
 * 이미 확정한 값과 다를 때만 후보로 본다.
 */
const suggestedLabel = computed(() => {
  const suggestion = chatStore.suggestedReflection
  if (!suggestion) return undefined
  const confirmed = chatStore.reflection
  if (step.value === 'qaSatisfaction')
    return suggestion.satisfaction === confirmed.satisfaction
      ? undefined
      : labelOf(SATISFACTION_OPTIONS, suggestion.satisfaction)
  if (step.value === 'qaPurpose')
    return suggestion.purpose === null || suggestion.purpose === confirmed.purpose
      ? undefined
      : labelOf(PURPOSE_OPTIONS, suggestion.purpose)
  if (step.value === 'qaCompanion')
    return suggestion.companion === null || suggestion.companion === confirmed.companion
      ? undefined
      : labelOf(COMPANION_OPTIONS, suggestion.companion)
  if (step.value === 'qaRepeat')
    return suggestion.repeatIntent === null || suggestion.repeatIntent === confirmed.repeatIntent
      ? undefined
      : labelOf(REPEAT_OPTIONS, suggestion.repeatIntent)
  return undefined
})

const activeSuggestion = ref<Suggestion | null>(null)
const serverGoals = ref<Goal[]>([])
const currentFrequency = computed(() => activeSuggestion.value?.txCount ?? 4)
const frequency = ref(2)
const requestPending = ref(false)
const reasonExpanded = ref(false)
/** FR-08-03 — 예상 절감액은 묶음의 평균 거래금액(avgAmount) × 조정 횟수다. 부담 산식과 다르다. */
const behaviorAvgAmount = computed(() => activeSuggestion.value?.avgAmount ?? 21_700)
const expectedSaving = computed(
  () => (currentFrequency.value - frequency.value) * behaviorAvgAmount.value,
)

const fallbackGoals = [
  {
    key: 'travel',
    label: '여행 자금',
    desc: '즐거운 여행을 위한 자금이에요.',
    saved: 310_000,
    target: 1_000_000,
    icon: IconTargetArrow,
  },
  {
    key: 'emergency',
    label: '비상금',
    desc: '예기치 않은 상황을 대비하는 자금이에요.',
    saved: 180_000,
    target: 500_000,
    icon: IconShieldLock,
  },
  {
    key: 'free',
    label: '자유 자금',
    desc: '나를 위한 자유로운 지출을 위한 자금이에요.',
    saved: 92_000,
    target: 300_000,
    icon: IconGift,
  },
]
const goals = computed(() =>
  serverGoals.value.length > 0
    ? serverGoals.value.map((goal) => ({
        key: String(goal.id),
        label: goal.name,
        desc: `${goal.name} 목표예요.`,
        saved: goal.currentAmount + goal.adoptedSaving,
        target: goal.targetAmount,
        icon: IconTargetArrow,
      }))
    : fallbackGoals,
)
const goalKey = ref('travel')
const selectedGoal = computed(
  () => goals.value.find((goal) => goal.key === goalKey.value) ?? goals.value[0]!,
)
const hasServerGoal = computed(() => serverGoals.value.length > 0)
const goalBefore = computed(() =>
  Math.round((selectedGoal.value.saved / selectedGoal.value.target) * 100),
)
const goalAfter = computed(() =>
  Math.round(((selectedGoal.value.saved + expectedSaving.value) / selectedGoal.value.target) * 100),
)

const profileTags = [
  {
    label: '가치 중심 소비',
    icon: IconShieldCheck,
    cardClass: 'bg-profile-green',
    iconClass: 'bg-success/15 text-success',
  },
  {
    label: '편의성 우선',
    icon: IconClock,
    cardClass: 'bg-profile-orange',
    iconClass: 'bg-preview-yellow-ink/15 text-preview-yellow-ink',
  },
  {
    label: '변동 지출 편중',
    icon: IconChartPie,
    cardClass: 'bg-profile-red',
    iconClass: 'bg-preview-red-ink/15 text-preview-red-ink',
  },
]

const fallbackBehaviorSummary = [
  {
    label: '친구와 외식',
    desc: '주 1~2회 외식으로 관계를 즐겨요.',
    verdict: PRESCRIPTION_LABEL.PROTECT,
    icon: IconBurger,
    iconClass: 'bg-profile-green text-success',
    tagClass: 'bg-success/10 text-success',
  },
  {
    label: '카페',
    desc: '일품 커피를 즐겨요.',
    verdict: PRESCRIPTION_LABEL.KEEP,
    icon: IconCoffee,
    iconClass: 'bg-profile-blue text-preview-blue-ink',
    tagClass: 'bg-preview-blue-ink/10 text-preview-blue-ink',
  },
  {
    label: '택시 이용',
    desc: '교통비 지출이 다소 높은 편이에요.',
    verdict: PRESCRIPTION_LABEL.MINOR,
    icon: IconCar,
    iconClass: 'bg-profile-orange text-preview-yellow-ink',
    tagClass: 'bg-preview-yellow-ink/10 text-preview-yellow-ink',
  },
  {
    label: '심야 배달',
    desc: '잦은 심야 배달이 지출을 늘려요.',
    verdict: PRESCRIPTION_LABEL.PRIORITY,
    icon: IconMoped,
    iconClass: 'bg-profile-red text-preview-red-ink',
    tagClass: 'bg-preview-red-ink/10 text-preview-red-ink',
  },
]
const analysisData = ref<Analysis | null>(null)
const behaviorSummary = computed(() => {
  if (!analysisData.value || analysisData.value.byCategory.length === 0)
    return fallbackBehaviorSummary

  return analysisData.value.byCategory.slice(0, 4).map((category) => {
    const adjust = category.verdict === 'ADJUST'
    return {
      label: category.category,
      desc: `이번 달 ${category.monthlyTotalAmount.toLocaleString('ko-KR')}원을 사용했어요.`,
      verdict: adjust ? PRESCRIPTION_LABEL.PRIORITY : PRESCRIPTION_LABEL.KEEP,
      icon: adjust ? IconMoped : IconCoffee,
      iconClass: adjust
        ? 'bg-profile-red text-preview-red-ink'
        : 'bg-profile-blue text-preview-blue-ink',
      tagClass: adjust
        ? 'bg-preview-red-ink/10 text-preview-red-ink'
        : 'bg-preview-blue-ink/10 text-preview-blue-ink',
    }
  })
})
async function startRetrospect() {
  chatStore.activate('retrospect')
  if (chatStore.steps.retrospect !== 'menu' || requestPending.value) return
  say('user', '회고를 등록하고 싶어요!')
  requestPending.value = true
  try {
    chatStore.candidates = await getRetrospectCandidates(CANDIDATE_LIMIT, {
      from: kstDateIso(CHAT_WINDOW_DAYS - 1),
      to: kstDateIso(0),
    })
  } catch (error) {
    say(
      'ai',
      await apiErrorMessage(error, '회고 후보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'),
    )
    return
  } finally {
    requestPending.value = false
  }
  const first = chatStore.candidates[0]
  // 후보가 없으면 03 S10 빈 상태다. 후보 제외는 저장하지 않는다 (01 E-49).
  if (!first) {
    step.value = 'empty'
    return
  }
  chatStore.selectedCandidate = first
  pickedId.value = first.transactionId
  step.value = 'candidate'
}

async function loadImprovement() {
  try {
    const [suggestions, goalsResult] = await Promise.all([getSuggestions('PROPOSED'), getGoals()])
    const requestedId = Number(route.query.suggestionId)
    activeSuggestion.value =
      suggestions.find((suggestion) => suggestion.id === requestedId) ?? suggestions[0] ?? null
    serverGoals.value = goalsResult
    if (activeSuggestion.value)
      frequency.value = activeSuggestion.value.txCount - activeSuggestion.value.adjustCount
    if (goalsResult[0]) goalKey.value = String(goalsResult[0].id)
  } catch (error) {
    say(
      'ai',
      await apiErrorMessage(error, '개선 방안을 불러오지 못했어요. 잠시 후 다시 시도해주세요.'),
    )
  }
}

onMounted(() => {
  if (step.value === 'improvement') void loadImprovement()
})

async function startAnalysis() {
  chatStore.activate('analysis')
  if (chatStore.steps.analysis !== 'menu' || requestPending.value) return
  requestPending.value = true
  say('user', '제 소비를 분석해주세요')
  try {
    analysisData.value = await getAnalysis()
    say('ai', analysisData.value.highlight || '이번 달 소비 패턴을 분석했어요.', qnaImage)
  } catch (error) {
    say(
      'ai',
      await apiErrorMessage(error, '소비 분석을 불러오지 못했어요. 잠시 후 다시 시도해주세요.'),
      qnaImage,
    )
  } finally {
    requestPending.value = false
  }
  chatStore.analysisTimelineBreak = chatStore.histories.analysis.length
  step.value = 'analysis'
}

function startQna() {
  chatStore.activate('qna')
  if (chatStore.steps.qna !== 'menu') return
  say('user', '금융 지식이 궁금해요')
  say('ai', '무엇이든 물어보세요! 예금·적금, 신용점수, 예산 관리처럼 궁금한 주제를 입력해 주세요.')
  step.value = 'qna'
}

async function onShortcut(key: 'retrospect' | 'analysis' | 'qna') {
  if (key === 'retrospect') await startRetrospect()
  else if (key === 'analysis') await startAnalysis()
  else startQna()
}

async function onSend(text: string) {
  const message = text.trim()
  if (requestPending.value) return
  // 05 §2 #11 · #24의 상한은 서버 `@Size`와 같은 UTF-16 단위다 (01 E-112).
  if (message.length === 0 || message.length > 500) {
    say('ai', '메시지는 공백 없이 500자 이내로 입력해 주세요.')
    return
  }
  // 방금 보낼 메시지는 이력에서 빼야 하므로 대화에 쌓기 전에 먼저 모은다.
  const recent = recentMessages()
  say('user', message)
  if (activeMode.value === 'qna') {
    requestPending.value = true
    try {
      const response = await askFinance(message)
      say(
        'ai',
        response.fallback
          ? `AI 연결이 원활하지 않아 기본 안내로 답변드려요. ${response.reply}`
          : response.reply,
      )
    } catch (error) {
      say(
        'ai',
        await apiErrorMessage(
          error,
          '금융 Q&A 답변을 불러오지 못했어요. 잠시 후 다시 질문해주세요.',
        ),
      )
    } finally {
      requestPending.value = false
    }
  } else if (activeMode.value === 'analysis') {
    say('ai', '소비 분석에 대한 질문을 확인했어요. 현재 분석 맥락에서 이어서 살펴볼게요.')
  } else {
    const candidate = chatStore.selectedCandidate
    if (!candidate) {
      say('ai', '먼저 회고할 거래를 골라 주세요.')
      return
    }
    requestPending.value = true
    try {
      applyChatResult(
        await chatRetrospect({
          transactionId: candidate.transactionId,
          message,
          step: reflectionStepOf(step.value),
          reflection: chatStore.reflection,
          recentMessages: recent,
        }),
        thinkingAvatar,
      )
    } catch (error) {
      await handleRetrospectChatError(error)
    } finally {
      requestPending.value = false
    }
  }
}

/**
 * 05 §2 #11 응답을 화면에 반영한다.
 * `step`은 서버가 계산한 다음 단계를 그대로 따르고, `reflection`은 확정하지 않은 AI 후보값이다.
 */
function applyChatResult(result: RetrospectChatResult, avatar?: string) {
  chatStore.templateMode = result.fallback
  chatStore.suggestedReflection = result.reflection
  say('ai', result.reply, avatar)
  step.value = CHAT_STEP_BY_REFLECTION_STEP[result.step]
}

async function handleRetrospectChatError(error: unknown) {
  if (error instanceof ApiError && error.code === 'LLM_UNAVAILABLE') {
    // 503이면 템플릿 배너를 띄우고 P0 선택지 버튼으로 그대로 이어간다 (03 S11 · FR-04-15).
    chatStore.templateMode = true
    say('ai', '지금은 AI 연결이 원활하지 않아 기본 질문으로 이어갈게요.', thinkingAvatar)
    return
  }
  if (error instanceof ApiError && error.code === 'DUPLICATE_RETROSPECT') {
    say('ai', '이미 회고한 거래예요. 다른 거래를 골라 주세요.', searchAvatar)
    backToCandidates()
    return
  }
  if (error instanceof ApiError && error.code === 'NOT_FOUND') {
    say('ai', '그 거래를 찾지 못했어요. 다른 거래를 골라 주세요.', searchAvatar)
    backToCandidates()
    return
  }
  say(
    'ai',
    await apiErrorMessage(error, '회고 대화를 이어가지 못했어요. 잠시 후 다시 시도해주세요.'),
  )
}

function backToCandidates() {
  chatStore.selectedCandidate = null
  chatStore.resetReflection()
  step.value = chatStore.candidates.length > 0 ? 'pick' : 'empty'
}

function acceptCandidate() {
  say('user', '회고해볼게요')
  void startQa()
}

function openPicker() {
  say('user', '다른 거래를 선택할게요')
  say('ai', '좋아요! 어떤 거래로 회고를 시작할까요? 아래에서 선택해 주세요.', searchAvatar)
  step.value = 'pick'
}

function confirmPick() {
  const picked = candidates.value.find((c) => c.transactionId === pickedId.value)
  if (!picked) return
  chatStore.selectedCandidate = picked
  void startQa()
}

/**
 * 후보를 고른 직후 `INTRO` 턴을 한 번 부른다 (`message` 생략).
 * 응답 `reply`가 선정 이유를 AI가 재구성한 첫 발화다 (FR-04-10·11).
 */
async function startQa() {
  const candidate = chatStore.selectedCandidate
  if (!candidate || requestPending.value) return
  chatStore.resetReflection()
  // 여기부터가 이 거래의 대화다. 앞선 거래의 답이 다음 요청에 실리지 않게 경계를 옮긴다.
  chatStore.retrospectHistoryStart = chatStore.histories.retrospect.length
  say('user', `${candidate.merchant} ${candidate.amount.toLocaleString('ko-KR')}원 회고할게요`)
  // 서버가 실패해도 P0 선택지 모드로 이어갈 수 있게 먼저 단계를 옮긴다.
  step.value = 'qaSatisfaction'
  requestPending.value = true
  try {
    applyChatResult(
      await chatRetrospect({
        transactionId: candidate.transactionId,
        step: 'INTRO',
        reflection: chatStore.reflection,
        recentMessages: recentMessages(),
      }),
      cheerAvatar,
    )
  } catch (error) {
    await handleRetrospectChatError(error)
  } finally {
    requestPending.value = false
  }
}

function answer(question: string, value: string, nextStep: ChatStep) {
  chatStore.suggestedReflection = null
  say('ai', question, thinkingAvatar)
  say('user', value)
  step.value = nextStep
}

// 칩 선택은 서버를 부르지 않는다 — 사용자가 확정한 값만 reflection에 담는다 (P0 선택지 모드 · E-20).
function answerSatisfaction(label: string) {
  chatStore.reflection.satisfaction = tagValue(SATISFACTION_OPTIONS, label)
  answer('이 소비는 어땠나요?', label, 'qaPurpose')
}

function answerPurpose(label: string) {
  chatStore.reflection.purpose = tagValue(PURPOSE_OPTIONS, label)
  answer('이 소비의 목적은 무엇이었나요?', label, 'qaCompanion')
}

function answerCompanion(label: string) {
  chatStore.reflection.companion = tagValue(COMPANION_OPTIONS, label)
  answer('이 소비는 누구와 함께했나요?', label, 'qaRepeat')
}

function answerRepeat(label: string) {
  chatStore.reflection.repeatIntent = tagValue(REPEAT_OPTIONS, label)
  answer('이 소비를 앞으로도 반복할 의향이 있나요?', label, 'wrapup')
}

/**
 * 05 §2 `POST /retrospects` (FR-04-14).
 * **저장이 성공한 뒤에만** 저장 안내와 소비 분석 채널 전환을 한다.
 * 저장 응답(`behaviorId` 등)은 이번 범위에서 쓰지 않는다 — 지도·제안은 다음 조회에서 재계산값을 받는다 (01 E-61 · E-81).
 */
async function finishRetrospect() {
  const candidate = chatStore.selectedCandidate
  if (!candidate || requestPending.value) return

  // 확정하지 않은 항목이 남았으면 값을 지어내지 않고 그 질문으로 되돌아간다 (01 E-20).
  const { satisfaction, purpose, companion, repeatIntent } = chatStore.reflection
  if (purpose === null || companion === null || repeatIntent === null) {
    say('ai', '저장하기 전에 남은 질문 하나만 확인할게요.', thinkingAvatar)
    step.value = purpose === null ? 'qaPurpose' : companion === null ? 'qaCompanion' : 'qaRepeat'
    return
  }

  say('user', '회고 마무리하기')
  requestPending.value = true
  try {
    await saveRetrospect({
      transactionId: candidate.transactionId,
      satisfaction,
      purpose,
      companion,
      repeatIntent,
      source: 'CANDIDATE',
    })
  } catch (error) {
    if (error instanceof ApiError && error.code === 'DUPLICATE_RETROSPECT') {
      say('ai', '이미 회고한 거래예요. 다른 거래를 골라 주세요.', searchAvatar)
      backToCandidates()
      return
    }
    say('ai', await apiErrorMessage(error, '회고를 저장하지 못했어요. 다시 시도해주세요.'))
    return
  } finally {
    requestPending.value = false
  }

  // 회고가 생긴 거래는 다음 조회에서 후보에서 빠진다 (01 E-62) — 목록에서도 바로 뺀다.
  chatStore.candidates = chatStore.candidates.filter(
    (c) => c.transactionId !== candidate.transactionId,
  )
  chatStore.selectedCandidate = null
  chatStore.resetReflection()
  reasonExpanded.value = false
  say('ai', '회고를 저장했어요. 이어지는 소비 분석에서 행동 조정안을 확인해 주세요.', happyAvatar)
  chatStore.activate('analysis')
  if (chatStore.histories.analysis.length === 0) {
    say('ai', '방금 마친 회고를 바탕으로 행동 조정안을 정리해봤어요.', searchAvatar)
  }
  step.value = 'improvement'
  void loadImprovement()
}

async function rejectSuggestion() {
  if (activeSuggestion.value) {
    try {
      await rejectSuggestionById(activeSuggestion.value.id)
    } catch (error) {
      say('ai', await apiErrorMessage(error, '제안 거절을 저장하지 못했어요. 다시 시도해주세요.'))
      return
    }
  }
  say('user', '제안을 거절할게요')
  say('ai', '알겠어요! 필요할 때 언제든 다시 도와드릴게요 🙂', aiSmallAvatarImage)
  chatStore.analysisTimelineBreak = chatStore.histories.analysis.length
  step.value = 'analysis'
}

function answerFinance(value: string) {
  void onSend(value)
}

async function confirmAllocate() {
  if (activeSuggestion.value) {
    try {
      const goalId = Number(goalKey.value)
      await adoptSuggestion(activeSuggestion.value.id, {
        adjustCount: currentFrequency.value - frequency.value,
        ...(hasServerGoal.value && Number.isInteger(goalId) ? { goalId } : {}),
      })
    } catch (error) {
      say(
        'ai',
        await apiErrorMessage(error, '목표 자금 적용을 저장하지 못했어요. 다시 시도해주세요.'),
      )
      return
    }
  }
  say(
    'user',
    hasServerGoal.value
      ? `${selectedGoal.value.label}에 연결할게요`
      : '목표 연결 없이 제안만 채택할게요',
  )
  say('ai', '마지막으로 이번 소비 상황을 요약해드릴게요.', qnaImage)
  chatStore.analysisTimelineBreak = chatStore.histories.analysis.length
  step.value = 'analysis'
}

async function apiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback
  if (error.code === 'UNAUTHORIZED') {
    userStore.signOut()
    await router.push({ name: 'login' })
    return '로그인이 만료되어 로그인 화면으로 이동했어요.'
  }
  if (error.code === 'ONBOARDING_REQUIRED') {
    await router.push({ name: 'onboarding' })
    return '먼저 온보딩을 완료해 주세요.'
  }
  if (error.code === 'INVALID_INPUT')
    return '입력값을 확인해 주세요. 같은 요청을 반복해도 저장되지 않아요.'
  if (error.code === 'LLM_UNAVAILABLE')
    return 'AI 연결이 원활하지 않아 지금은 기본 안내 모드로 답변드릴게요.'
  return fallback
}
</script>

<template>
  <div class="flex h-full flex-col">
    <AppTopBar
      title="AI 채팅"
      bell
      bell-dot
    />

    <div
      v-if="activeMode === 'retrospect' && chatStore.templateMode"
      role="status"
      class="bg-preview-yellow text-preview-yellow-ink flex shrink-0 items-center gap-2 px-4 py-2.5 text-[13px] font-medium"
    >
      <IconAlertTriangle
        :size="16"
        class="shrink-0"
      />
      <span class="flex-1">기본 질문으로 진행하고 있어요.</span>
      <button
        type="button"
        class="shrink-0 font-bold underline"
        @click="chatStore.templateMode = false"
      >
        다시 연결
      </button>
    </div>

    <main
      ref="thread"
      class="bg-surface flex-1 space-y-4 overflow-y-auto p-4"
    >
      <div
        v-if="history.length === 0"
        class="space-y-4"
      >
        <div class="flex items-start gap-2">
          <span
            class="bg-brand-soft flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full"
            ><img
              :src="aiAvatarImage"
              alt=""
              class="h-[52px] w-[38px] object-cover"
          /></span>
          <span class="flex flex-col items-start gap-1">
            <span
              class="bg-progress-track text-ink flex w-[260px] flex-col gap-1 rounded-2xl rounded-tl px-3.5 py-3"
              ><strong class="text-sm">안녕하세요! AI 소때잡 비서예요.</strong
              ><span class="text-[13px] font-medium leading-5"
                >내 소비에 맞는 바꿀 타이밍 잡아봐요!<br />무엇을 도와드릴까요?</span
              ></span
            >
            <span class="text-ink-faint text-[11px]">오전 9:41</span>
          </span>
        </div>
        <div class="flex items-start gap-2">
          <span
            class="bg-brand-soft flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full"
            ><img
              :src="aiSmallAvatarImage"
              alt=""
              class="size-[45px] rounded-[18px] object-cover"
          /></span>
          <span class="flex min-w-0 flex-1 flex-col items-start gap-2">
            <span
              class="bg-progress-track text-ink w-[260px] rounded-2xl rounded-tl px-3.5 py-3 text-[13px] font-medium leading-5"
              >원하는 기능을 누르거나 아래 채팅창에 바로 입력해도 돼요.</span
            >
            <span class="text-ink-faint text-[11px]">오전 9:41</span>
          </span>
        </div>
      </div>
      <template v-if="step !== 'analysis'">
        <template
          v-for="(entry, index) in history"
          :key="index"
        >
          <ChatBubble
            :role="entry.role"
            :avatar="entry.avatar"
            :user-solid="step === 'pick'"
            >{{ entry.text }}</ChatBubble
          >
        </template>
      </template>

      <template v-if="step === 'menu'">
        <p class="sr-only">무엇을 도와드릴까요?</p>
        <button
          type="button"
          class="sr-only"
          @click="startRetrospect"
        >
          회고 등록
        </button>
        <div class="ml-16 flex flex-col gap-2">
          <button
            type="button"
            class="border-line bg-surface flex min-h-[83px] w-full items-center gap-3 rounded-xl border p-3.5 text-left"
            @click="startRetrospect"
          >
            <span
              class="bg-brand-soft flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full"
            >
              <img
                :src="retrospectImage"
                alt=""
                class="size-[35px] object-contain"
              />
            </span>
            <span class="min-w-0 flex-1"
              ><strong class="text-ink block text-[15px]">회고 등록</strong
              ><span class="text-ink-faint mt-0.5 block text-[13px] leading-[1.3]"
                >최근 소비 중 돌아볼 거래를 찾아볼게요.</span
              ></span
            >
            <IconChevronRight
              :size="16"
              class="text-ink-faint shrink-0"
            />
          </button>
          <button
            type="button"
            class="border-line bg-surface flex min-h-[83px] w-full items-center gap-3 rounded-xl border p-3.5 text-left"
            @click="startAnalysis"
          >
            <span
              class="bg-brand-soft flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full"
            >
              <img
                :src="analysisImage"
                alt=""
                class="size-[35px] object-contain"
              />
            </span>
            <span class="min-w-0 flex-1"
              ><strong class="text-ink block text-[15px]">소비 분석</strong
              ><span class="text-ink-faint mt-0.5 block text-[13px] leading-[1.3]"
                >이번 달 소비 패턴을 분석하고 만족도 지도를 확인해요.</span
              ></span
            >
            <IconChevronRight
              :size="16"
              class="text-ink-faint shrink-0"
            />
          </button>
          <button
            type="button"
            class="border-line bg-surface flex min-h-[83px] w-full items-center gap-3 rounded-xl border p-3.5 text-left"
            @click="startQna"
          >
            <span
              class="bg-brand-soft flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full"
            >
              <img
                :src="qnaImage"
                alt=""
                class="size-[35px] object-contain"
              />
            </span>
            <span class="min-w-0 flex-1"
              ><strong class="text-ink block text-[15px]">금융 지식 Q&amp;A</strong
              ><span class="text-ink-faint mt-0.5 block text-[13px] leading-[1.3]"
                >금융에 대해 궁금한 점을 질문하고 쉽게 답을 받아보세요.</span
              ></span
            >
            <IconChevronRight
              :size="16"
              class="text-ink-faint shrink-0"
            />
          </button>
        </div>
      </template>
      <template v-else-if="step === 'candidate' && selected">
        <ChatBubble
          role="ai"
          :avatar="activeAvatar"
        >
          <p class="font-semibold">회고 후보로 선정된 거래예요 🎯</p>
          <p class="mt-1">
            이 거래는 반복되거나 금액이 큰 지출이에요.<br />돌아볼 가치가 있는 소비로 추천드려요! 😊
          </p>
        </ChatBubble>

        <div class="border-line rounded-2xl border p-4">
          <div class="flex items-center gap-3">
            <MerchantBadge :name="selected.merchant" />
            <div class="flex-1">
              <p class="text-ink font-semibold">{{ selected.merchant }}</p>
              <p class="text-ink text-lg font-bold">
                {{ selected.amount.toLocaleString('ko-KR') }}원
              </p>
              <p class="text-ink-muted text-xs">{{ formatOccurredAt(selected.occurredAt) }}</p>
            </div>
          </div>
          <div class="mt-3 flex gap-2">
            <span
              v-if="selected.timeSlot === 'NIGHT'"
              class="text-brand bg-brand/10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
            >
              <IconMoonStars :size="13" /> 심야
            </span>
            <span
              class="text-brand bg-brand/10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
            >
              {{ selected.category }}
            </span>
          </div>
        </div>

        <div class="bg-progress-track rounded-2xl p-4">
          <p class="text-preview-blue-ink flex items-center gap-1.5 text-[13px] font-bold">
            <IconBulb
              :size="16"
              class="text-brand"
            />
            이 거래를 회고 후보로 선정한 이유
          </p>
          <p class="text-ink-muted mt-2 flex gap-2 text-sm">
            <IconCheck
              :size="15"
              class="text-brand mt-0.5 shrink-0"
            />
            {{ selected.reason }}
          </p>
        </div>

        <div class="space-y-2">
          <PrimaryButton
            arrow
            @click="acceptCandidate"
            >회고해볼게요</PrimaryButton
          >
          <PrimaryButton
            variant="outline"
            @click="openPicker"
            >이번 거래는 제외</PrimaryButton
          >
        </div>
      </template>

      <template v-else-if="step === 'empty'">
        <ChatBubble
          role="ai"
          :avatar="activeAvatar"
        >
          <p class="font-semibold">지금은 돌아볼 거래가 없어요 🌱</p>
          <p class="mt-1">최근 3일 안에는 회고 조건을 채운 거래가 없었어요.</p>
        </ChatBubble>

        <div class="border-line bg-surface rounded-2xl border p-4">
          <p class="text-ink flex items-center gap-1.5 text-[13px] font-bold">
            <IconClock
              :size="16"
              class="text-brand"
            />
            어떤 거래가 후보가 되나요?
          </p>
          <ul class="text-ink-muted mt-2 space-y-1.5 text-sm">
            <li>· 결제한 지 하루가 지난 거래예요.</li>
            <li>· 시간대 평균을 크게 넘거나, 설정한 임계값을 넘은 지출이에요.</li>
            <li>· 같은 묶음에서 만족도가 낮게 반복된 소비예요.</li>
          </ul>
          <p class="text-ink-faint mt-3 text-xs leading-[1.4]">
            새 거래내역을 올리거나 하루 뒤에 다시 확인해 주세요.
          </p>
        </div>
      </template>

      <template v-else-if="step === 'pick'">
        <div class="border-line ml-10 space-y-3 rounded-2xl border p-3">
          <div class="bg-surface-muted flex items-center gap-2 rounded-xl px-3 py-2">
            <IconSearch
              :size="16"
              class="text-ink-muted"
            />
            <input
              v-model="search"
              type="text"
              placeholder="상점명, 카테고리 검색"
              class="text-ink placeholder:text-ink-faint flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <div class="flex gap-2">
            <span class="border-brand text-brand rounded-full border px-3 py-1 text-xs font-medium"
              >최근 3일</span
            >
            <button
              type="button"
              class="rounded-full border px-3 py-1 text-xs font-medium"
              :class="nightOnly ? 'border-brand text-brand' : 'border-line text-ink-muted'"
              @click="nightOnly = !nightOnly"
            >
              심야
            </button>
            <button
              type="button"
              class="rounded-full border px-3 py-1 text-xs font-medium"
              :class="search === '식비' ? 'border-brand text-brand' : 'border-line text-ink-muted'"
              @click="search = search === '식비' ? '' : '식비'"
            >
              식비
            </button>
          </div>

          <div class="divide-line divide-y">
            <button
              v-for="c in filtered"
              :key="c.transactionId"
              type="button"
              class="flex w-full items-center gap-3 py-2.5"
              @click="pickedId = c.transactionId"
            >
              <MerchantBadge
                :name="c.merchant"
                size="sm"
              />
              <span class="flex-1 text-left">
                <span class="text-ink block text-sm font-semibold">{{ c.merchant }}</span>
                <span class="text-ink-muted block text-xs">{{ c.category }}</span>
              </span>
              <span class="text-right">
                <span class="text-ink block text-sm font-bold"
                  >{{ c.amount.toLocaleString('ko-KR') }}원</span
                >
                <span class="text-ink-muted block text-xs">{{
                  formatOccurredAt(c.occurredAt)
                }}</span>
              </span>
              <span
                class="flex size-5 shrink-0 items-center justify-center rounded-full border"
                :class="
                  pickedId === c.transactionId
                    ? 'border-brand bg-brand text-surface'
                    : 'border-line'
                "
              >
                <IconCheck
                  v-if="pickedId === c.transactionId"
                  :size="12"
                  :stroke-width="3"
                />
              </span>
            </button>
          </div>
        </div>
        <div class="ml-10">
          <PrimaryButton @click="confirmPick">선택한 거래로 회고 시작</PrimaryButton>
        </div>
      </template>

      <template v-else-if="step === 'qaSatisfaction'">
        <ChatBubble
          role="ai"
          :avatar="activeAvatar"
          >이 소비는 어땠나요?</ChatBubble
        >
        <ChatQuickReplies
          :options="satisfactionOptions"
          :suggested="suggestedLabel"
          @pick="answerSatisfaction"
        />
      </template>

      <template v-else-if="step === 'qaPurpose'">
        <ChatBubble
          role="ai"
          :avatar="activeAvatar"
          >이 소비의 목적은 무엇이었나요?</ChatBubble
        >
        <ChatQuickReplies
          :options="purposeOptions"
          :suggested="suggestedLabel"
          @pick="answerPurpose"
        />
      </template>

      <template v-else-if="step === 'qaCompanion'">
        <ChatBubble
          role="ai"
          :avatar="activeAvatar"
          >이 소비는 누구와 함께했나요?</ChatBubble
        >
        <ChatQuickReplies
          :options="companionOptions"
          :suggested="suggestedLabel"
          @pick="answerCompanion"
        />
      </template>

      <template v-else-if="step === 'qaRepeat'">
        <ChatBubble
          role="ai"
          :avatar="activeAvatar"
          >이 소비를 앞으로도 반복할 의향이 있나요?</ChatBubble
        >
        <ChatQuickReplies
          :options="repeatOptions"
          :suggested="suggestedLabel"
          @pick="answerRepeat"
        />
      </template>

      <template v-else-if="step === 'wrapup'">
        <ChatBubble
          role="ai"
          :avatar="activeAvatar"
        >
          좋아요! 회고가 거의 완료됐어요 👏<br />저장 후 개선 방안과 맞춤 분석을 이어서
          도와드릴게요.
        </ChatBubble>
        <div class="ml-10 flex gap-2">
          <button
            type="button"
            class="border-line text-ink flex-1 rounded-2xl border py-3.5 text-sm font-semibold"
            @click="step = 'pick'"
          >
            다른 소비 회고하기
          </button>
          <button
            type="button"
            class="bg-brand text-surface flex-1 rounded-2xl py-3.5 text-sm font-semibold"
            @click="finishRetrospect"
          >
            회고 마무리하기
          </button>
        </div>
      </template>

      <template v-else-if="step === 'improvement'">
        <div class="border-line bg-surface space-y-3 rounded-2xl border p-4">
          <span
            class="bg-brand text-surface inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold"
          >
            AI 추천
          </span>

          <div class="flex items-center gap-3">
            <span
              class="bg-brand-soft flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <IconMoonStars
                :size="22"
                class="text-brand"
                :stroke-width="1.7"
              />
            </span>
            <div class="min-w-0">
              <p class="text-ink text-base font-bold">
                {{ activeSuggestion?.behaviorName ?? '심야 배달' }} 줄이기
              </p>
              <p class="text-ink-faint text-xs">
                {{ activeSuggestion?.reason ?? '밤 10시 이후 배달 주문을 줄여보세요.' }}
              </p>
            </div>
          </div>

          <div class="bg-divider h-px" />

          <div class="space-y-2">
            <p class="text-ink text-[13px] font-bold">AI가 분석한 최적의 추천 빈도</p>
            <div class="flex items-center justify-between gap-3">
              <p class="text-ink shrink-0 text-xl font-bold">
                월 {{ currentFrequency }}회 →
                <span class="text-brand">월 {{ frequency }}회</span>
              </p>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="추천 빈도 줄이기"
                  class="bg-brand text-surface flex size-10 items-center justify-center rounded-full border border-brand text-xl"
                  :disabled="frequency <= 0"
                  :class="{ 'opacity-40': frequency <= 0 }"
                  @click="frequency = Math.max(0, frequency - 1)"
                >
                  −
                </button>
                <strong class="text-ink min-w-10 text-center text-[24px]">{{ frequency }}회</strong>
                <button
                  type="button"
                  aria-label="추천 빈도 늘리기"
                  class="border-line text-ink bg-surface flex size-10 items-center justify-center rounded-full border text-2xl"
                  :disabled="frequency >= currentFrequency - 1"
                  :class="{ 'opacity-40': frequency >= currentFrequency - 1 }"
                  @click="frequency = Math.min(currentFrequency - 1, frequency + 1)"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div class="bg-divider h-px" />

          <div class="grid grid-cols-2 gap-2.5">
            <div class="border-brand-line h-[115px] min-w-0 rounded-xl border p-3">
              <span class="bg-brand-soft flex size-8 items-center justify-center rounded-full">
                <IconChartBar
                  :size="18"
                  class="text-brand"
                  :stroke-width="1.7"
                />
              </span>
              <p class="text-ink mt-2 text-[14px] font-semibold">예상 절감액</p>
              <p class="text-brand mt-1 text-base font-bold">
                월 {{ expectedSaving.toLocaleString('ko-KR') }}원
              </p>
            </div>
            <div
              v-if="hasServerGoal"
              class="border-brand-line h-[115px] min-w-0 rounded-xl border p-3"
            >
              <span class="bg-brand-soft flex size-8 items-center justify-center rounded-full">
                <IconTargetArrow
                  :size="18"
                  class="text-brand"
                  :stroke-width="1.7"
                />
              </span>

              <p class="text-ink mt-2 text-[14px] font-semibold">{{ selectedGoal.label }} 달성률</p>
              <p class="text-ink mt-1 text-sm font-bold">
                {{ goalBefore }}% → <span class="text-brand text-xl">{{ goalAfter }}%</span>
              </p>
            </div>
            <div
              v-else
              class="border-brand-line text-ink-muted flex h-[115px] min-w-0 items-center rounded-xl border p-3 text-xs leading-5"
            >
              등록된 목표가 없어 제안만 채택돼요. 목표 설정에서 나중에 연결할 수 있어요.
            </div>
          </div>
        </div>

        <div class="border-line bg-surface overflow-hidden rounded-xl border">
          <button
            type="button"
            class="text-ink-muted flex w-full items-center gap-2 px-4 py-3.5 text-left text-[13px] font-medium"
            :aria-expanded="reasonExpanded"
            aria-controls="action-plan-reasons"
            @click="reasonExpanded = !reasonExpanded"
          >
            <IconChevronUp
              v-if="reasonExpanded"
              :size="16"
            />
            <IconChevronDown
              v-else
              :size="16"
            />
            왜 이 제안이 도움이 될까요?
          </button>

          <div
            v-if="reasonExpanded"
            id="action-plan-reasons"
            class="bg-brand/5 space-y-4 px-4 pb-4 pt-3"
          >
            <div class="flex items-start gap-3">
              <span
                class="bg-brand-soft flex size-9 shrink-0 items-center justify-center rounded-full"
              >
                <IconChartBar
                  :size="18"
                  class="text-brand"
                />
              </span>
              <div>
                <p class="text-ink text-[13px] font-bold">
                  평균 주문 금액이 늦은 시간대에 더 높아요
                </p>
                <p class="text-ink-muted mt-1 text-xs leading-[1.4]">
                  심야 시간대 1회 주문 금액이 평균 15% 더 높아요.
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <span
                class="bg-brand-soft flex size-9 shrink-0 items-center justify-center rounded-full"
              >
                <IconRepeat
                  :size="18"
                  class="text-brand"
                />
              </span>
              <div>
                <p class="text-ink text-[13px] font-bold">습관적으로 반복되기 쉬워요</p>
                <p class="text-ink-muted mt-1 text-xs leading-[1.4]">
                  늦은 시간엔 계획보다 충동적인 소비가 늘어나요.
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <span
                class="bg-brand-soft flex size-9 shrink-0 items-center justify-center rounded-full"
              >
                <IconMoonStars
                  :size="18"
                  class="text-brand"
                />
              </span>
              <div>
                <p class="text-ink text-[13px] font-bold">수면의 질에도 영향을 줘요</p>
                <p class="text-ink-muted mt-1 text-xs leading-[1.4]">
                  야식은 수면 리듬을 깨고, 다음 날 컨디션 저하로 이어질 수 있어요.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            type="button"
            class="border-brand text-brand flex-1 rounded-[14px] border py-3.5 text-sm font-semibold"
            @click="rejectSuggestion"
          >
            제안 거절하기
          </button>
          <button
            type="button"
            class="bg-brand text-surface flex flex-1 items-center justify-center gap-1 rounded-[14px] py-3.5 text-sm font-semibold"
            @click="confirmAllocate"
          >
            {{ hasServerGoal ? '목표 자금에 적용하기' : '제안만 채택하기' }}
          </button>
        </div>
      </template>
      <template v-else-if="step === 'analysis'">
        <ChatBubble
          v-for="(entry, index) in history.slice(0, chatStore.analysisTimelineBreak)"
          :key="`analysis-intro-${index}`"
          :role="entry.role"
          :avatar="entry.avatar"
        >
          {{ entry.text }}
        </ChatBubble>
        <section class="bg-surface flex flex-col gap-5 rounded-3xl p-5">
          <h2 class="text-ink text-base font-bold leading-[1.45]">
            AI가 분석한 당신의<br />소비 프로필이에요
          </h2>

          <div class="grid grid-cols-3 gap-2">
            <div
              v-for="tag in profileTags"
              :key="tag.label"
              class="flex h-[82px] min-w-0 flex-col items-center gap-2 rounded-2xl p-3"
              :class="tag.cardClass"
            >
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-[18px]"
                :class="tag.iconClass"
              >
                <component
                  :is="tag.icon"
                  :size="20"
                  :stroke-width="1.7"
                />
              </span>
              <p class="text-ink w-full whitespace-nowrap text-center text-xs font-bold">
                {{ tag.label }}
              </p>
            </div>
          </div>

          <div class="bg-line h-px w-full" />

          <h3 class="text-ink text-base font-bold">주요 소비 행동 분석</h3>

          <div class="flex flex-col gap-3">
            <div
              v-for="behavior in behaviorSummary"
              :key="behavior.label"
              class="border-line flex items-center justify-between border-b pb-3"
            >
              <div class="flex min-w-0 items-center gap-3">
                <span
                  class="flex size-9 shrink-0 items-center justify-center rounded-[18px]"
                  :class="behavior.iconClass"
                >
                  <component
                    :is="behavior.icon"
                    :size="18"
                    :stroke-width="1.7"
                  />
                </span>
                <span class="min-w-0">
                  <strong class="text-ink block text-sm">{{ behavior.label }}</strong>
                  <span class="text-ink-faint mt-0.5 block truncate text-[11px]">
                    {{ behavior.desc }}
                  </span>
                </span>
              </div>
              <span
                class="ml-2 shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold"
                :class="behavior.tagClass"
              >
                {{ behavior.verdict }}
              </span>
            </div>
          </div>

          <PrimaryButton
            arrow
            class="h-[52px] rounded-2xl text-base font-bold"
            @click="router.push('/map')"
          >
            만족도 지도 보기
          </PrimaryButton>
        </section>
        <ChatBubble
          role="ai"
          :avatar="searchAvatar"
        >
          금융에 대해 궁금한 게 있다면 뭐든 편하게 물어보세요!
        </ChatBubble>
        <ChatBubble
          v-for="(entry, index) in history.slice(chatStore.analysisTimelineBreak)"
          :key="`analysis-followup-${index}`"
          :role="entry.role"
          :avatar="entry.avatar"
        >
          {{ entry.text }}
        </ChatBubble>
      </template>
      <template v-else-if="step === 'qna'">
        <ChatQuickReplies
          :options="[
            '예금과 적금의 차이가 뭔가요?',
            '신용점수는 어떻게 관리하나요?',
            '월 예산은 어떻게 잡나요?',
          ]"
          @pick="answerFinance"
        />
      </template>
    </main>

    <ChatComposer
      :active-shortcut="activeMode"
      :disabled="requestPending"
      @send="onSend"
      @shortcut="onShortcut"
    />
    <AppBottomNav />
  </div>
</template>
