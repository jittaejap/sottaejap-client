<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconBulb,
  IconBurger,
  IconCar,
  IconChartBar,
  IconChartPie,
  IconCheck,
  IconChevronDown,
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
import aiAvatarImage from '@/assets/images/ai/01_main_wave_hat.png'
import aiSmallAvatarImage from '@/assets/images/ai/02_wave_small_hat.png'
import retrospectImage from '@/assets/images/ai/03_tablet_chat_hat.png'
import analysisImage from '@/assets/images/ai/09_search_hat.png'
import qnaImage from '@/assets/images/ai/06_idea_hat.png'
import happyAvatar from '@/assets/images/ai/04_happy_cheeks_hat.png'
import cheerAvatar from '@/assets/images/ai/07_cheer_hat.png'
import thinkingAvatar from '@/assets/images/ai/05_thinking_hat.png'
import searchAvatar from '@/assets/images/ai/09_search_hat.png'

const router = useRouter()

type Step =
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

const step = ref<Step>('menu')
const history = ref<{ role: 'ai' | 'user'; text: string; avatar?: string }[]>([])
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
  history.value.push({ role, text, avatar: role === 'ai' ? avatar : undefined })
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

const candidates = [
  {
    id: 1,
    merchant: '배달의민족',
    amount: 23_000,
    category: '식비 · 배달',
    when: '금요일 23:12',
    night: true,
  },
  {
    id: 2,
    merchant: '요기요',
    amount: 19_500,
    category: '식비 · 배달',
    when: '금요일 21:03',
    night: false,
  },
  {
    id: 3,
    merchant: '스타벅스',
    amount: 6_200,
    category: '식비 · 카페',
    when: '금요일 16:45',
    night: false,
  },
  {
    id: 4,
    merchant: 'GS25',
    amount: 4_500,
    category: '식비 · 편의점',
    when: '목요일 23:19',
    night: true,
  },
  {
    id: 5,
    merchant: '교촌치킨',
    amount: 21_000,
    category: '식비 · 배달',
    when: '목요일 21:55',
    night: false,
  },
  {
    id: 6,
    merchant: 'CU',
    amount: 3_200,
    category: '식비 · 편의점',
    when: '목요일 20:10',
    night: false,
  },
]

const selected = ref(candidates[0]!)
const search = ref('')
const nightOnly = ref(false)
const pickedId = ref(candidates[0]!.id)

const filtered = computed(() =>
  candidates.filter((c) => {
    const matchesText =
      search.value === '' || c.merchant.includes(search.value) || c.category.includes(search.value)
    return matchesText && (!nightOnly.value || c.night)
  }),
)

const purposeOptions = [
  '식사',
  '만남 · 사교',
  '휴식 · 취미',
  '필수품',
  '자기계발',
  '충동',
  '기타',
] as const
const companionOptions = ['혼자', '친구', '가족', '연인', '동료', '기타'] as const
const satisfactionOptions = ['만족했어요', '별로예요', '잘 모르겠어요'] as const
const repeatOptions = ['네', '아니오'] as const

const currentFrequency = 4
const frequency = ref(2)
const reasonExpanded = ref(false)
/** FR-08-03 — 예상 절감액은 묶음의 평균 거래금액(avgAmount) × 조정 횟수다. 부담 산식과 다르다. */
const behaviorAvgAmount = 21_700
const expectedSaving = computed(() => (currentFrequency - frequency.value) * behaviorAvgAmount)

const goals = [
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
const goalKey = ref('travel')
const selectedGoal = computed(() => goals.find((g) => g.key === goalKey.value)!)
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

const behaviorSummary = [
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
function startRetrospect() {
  say('user', '회고를 등록하고 싶어요!')
  step.value = 'candidate'
}

function startAnalysis() {
  say('user', '제 소비를 분석해주세요')
  say('ai', '이번 달 소비 패턴을 분석했어요. 요약해드릴게요.', qnaImage)
  step.value = 'analysis'
}

function startQna() {
  say('user', '금융 지식이 궁금해요')
  say('ai', '무엇이든 물어보세요! 예금·적금, 신용점수, 예산 관리처럼 궁금한 주제를 입력해 주세요.')
  step.value = 'qna'
}

function onShortcut(key: 'retrospect' | 'analysis' | 'qna') {
  if (key === 'retrospect') startRetrospect()
  else if (key === 'analysis') startAnalysis()
  else startQna()
}

function onSend(text: string) {
  say('user', text)
  say(
    'ai',
    '메시지를 확인했어요! 아래 버튼으로 회고 등록이나 소비 분석을 바로 시작할 수도 있어요 😊',
  )
}

function acceptCandidate() {
  say('user', '회고해볼게요')
  startQa()
}

function openPicker() {
  say('user', '다른 거래를 선택할게요')
  say('ai', '좋아요! 어떤 거래로 회고를 시작할까요? 아래에서 선택해 주세요.', searchAvatar)
  step.value = 'pick'
}

function confirmPick() {
  selected.value = candidates.find((c) => c.id === pickedId.value)!
  startQa()
}

function startQa() {
  say(
    'user',
    `${selected.value.merchant} ${selected.value.amount.toLocaleString('ko-KR')}원 회고할게요`,
  )
  say(
    'ai',
    `좋아요! ${selected.value.merchant} ${selected.value.amount.toLocaleString('ko-KR')}원에 대해 함께 돌아볼까요? 😊`,
    cheerAvatar,
  )
  step.value = 'qaSatisfaction'
}

function answer(question: string, value: string, nextStep: Step) {
  say('ai', question, thinkingAvatar)
  say('user', value)
  step.value = nextStep
}

function finishRetrospect() {
  reasonExpanded.value = false
  say('user', '회고 마무리하기')
  say('ai', '회고를 바탕으로 행동 조정안을 정리해봤어요.', searchAvatar)
  step.value = 'improvement'
}

function rejectSuggestion() {
  say('user', '제안을 거절할게요')
  say('ai', '알겠어요! 필요할 때 언제든 다시 도와드릴게요 🙂', aiSmallAvatarImage)
  step.value = 'menu'
}

function confirmAllocate() {
  say('user', `${selectedGoal.value.label}에 연결할게요`)
  say('ai', '마지막으로 이번 소비 상황을 요약해드릴게요.', qnaImage)
  step.value = 'analysis'
}
</script>

<template>
  <div class="flex h-full flex-col">
    <AppTopBar
      :title="step === 'analysis' ? '소비 분석' : 'AI 채팅'"
      bell
      bell-dot
    />

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
      <template v-else-if="step === 'candidate'">
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
              <p class="text-ink-muted text-xs">{{ selected.when }}</p>
            </div>
          </div>
          <div class="mt-3 flex gap-2">
            <span
              class="text-brand bg-brand/10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
            >
              <IconMoonStars :size="13" /> 심야
            </span>
            <span
              class="text-brand bg-brand/10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
            >
              <IconRepeat :size="13" /> 반복
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
          <ul class="text-ink-muted mt-2 space-y-1.5 text-sm">
            <li class="flex gap-2">
              <IconCheck
                :size="15"
                class="text-brand mt-0.5 shrink-0"
              />
              최근 30일 동안 심야 시간대 식비 지출이 반복되었어요.
            </li>
            <li class="flex gap-2">
              <IconCheck
                :size="15"
                class="text-brand mt-0.5 shrink-0"
              />
              비슷한 금액의 배달 주문이 자주 있었어요.
            </li>
            <li class="flex gap-2">
              <IconCheck
                :size="15"
                class="text-brand mt-0.5 shrink-0"
              />
              지출 패턴을 점검하면 더 나은 소비 습관을 만들 수 있어요.
            </li>
          </ul>
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
              >최근 30일</span
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
              :key="c.id"
              type="button"
              class="flex w-full items-center gap-3 py-2.5"
              @click="pickedId = c.id"
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
                <span class="text-ink-muted block text-xs">{{ c.when }}</span>
              </span>
              <span
                class="flex size-5 shrink-0 items-center justify-center rounded-full border"
                :class="pickedId === c.id ? 'border-brand bg-brand text-surface' : 'border-line'"
              >
                <IconCheck
                  v-if="pickedId === c.id"
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
          @pick="(v) => answer('이 소비는 어땠나요?', v, 'qaPurpose')"
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
          @pick="(v) => answer('이 소비의 목적은 무엇이었나요?', v, 'qaCompanion')"
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
          @pick="(v) => answer('이 소비는 누구와 함께했나요?', v, 'qaRepeat')"
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
          @pick="(v) => answer('이 소비를 앞으로도 반복할 의향이 있나요?', v, 'wrapup')"
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
              <p class="text-ink text-base font-bold">심야 배달 줄이기</p>
              <p class="text-ink-faint text-xs">밤 10시 이후 배달 주문을 줄여보세요.</p>
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
                  :disabled="frequency <= 1"
                  :class="{ 'opacity-40': frequency <= 1 }"
                  @click="frequency = Math.max(1, frequency - 1)"
                >
                  −
                </button>
                <strong class="text-ink min-w-10 text-center text-[24px]">{{ frequency }}회</strong>
                <button
                  type="button"
                  aria-label="추천 빈도 늘리기"
                  class="border-line text-ink bg-surface flex size-10 items-center justify-center rounded-full border text-2xl"
                  :disabled="frequency >= currentFrequency"
                  :class="{ 'opacity-40': frequency >= currentFrequency }"
                  @click="frequency = Math.min(currentFrequency, frequency + 1)"
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

            <div class="border-brand-line h-[115px] min-w-0 rounded-xl border p-3">
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
            목표 자금에 적용하기
          </button>
        </div>
      </template>
      <template v-else-if="step === 'analysis'">
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
      </template>
      <template v-else-if="step === 'qna'">
        <ChatQuickReplies
          :options="[
            '예금과 적금의 차이가 뭔가요?',
            '신용점수는 어떻게 관리하나요?',
            '월 예산은 어떻게 잡나요?',
          ]"
          @pick="
            (v) => {
              say('user', v)
              say(
                'ai',
                '좋은 질문이에요! 아직 준비 중인 답변이라, 곧 더 자세한 설명을 드릴 수 있도록 학습하고 있어요 🙂',
              )
              step = 'menu'
            }
          "
        />
      </template>
    </main>

    <ChatComposer
      :shortcuts="step !== 'menu'"
      @send="onSend"
      @shortcut="onShortcut"
    />
    <AppBottomNav />
  </div>
</template>
