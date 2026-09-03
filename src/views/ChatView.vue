<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconBulb,
  IconChartBar,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconDiamond,
  IconGift,
  IconMoonStars,
  IconPencil,
  IconQuestionMark,
  IconRepeat,
  IconSearch,
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
const history = ref<{ role: 'ai' | 'user'; text: string }[]>([])
const thread = useTemplateRef<HTMLElement>('thread')

function say(role: 'ai' | 'user', text: string) {
  history.value.push({ role, text })
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

const frequencyOptions = [
  { label: '유지', target: 4 },
  { label: '1회 줄이기', target: 3 },
  { label: '2회 줄이기', target: 2 },
  { label: '3회 줄이기', target: 1 },
]
const currentFrequency = 4
const frequency = ref(2)
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
    desc: '가치와 만족을 중심으로 지출하는 경향이 있어요.',
    icon: IconDiamond,
  },
  { label: '편의성 우선', desc: '시간과 편의를 위해 지출하는 편이에요.', icon: IconClock },
  { label: '변동 지출 편중', desc: '예측하기 어려운 변동 지출이 많아요.', icon: IconChartBar },
]

const behaviorSummary = [
  {
    label: '친구와 외식',
    desc: '주 1~2회 외식으로 관계를 즐겨요.',
    verdict: PRESCRIPTION_LABEL.PROTECT,
    tone: 'sustain' as const,
  },
  {
    label: '카페',
    desc: '주중 커피 지출이 평균 이상이에요.',
    verdict: PRESCRIPTION_LABEL.KEEP,
    tone: 'sustain' as const,
  },
  {
    label: '택시 이용',
    desc: '교통비 지출이 다소 높은 편이에요.',
    verdict: PRESCRIPTION_LABEL.MINOR,
    tone: 'adjust' as const,
  },
  {
    label: '심야 배달',
    desc: '잦은 심야 배달이 지출을 늘려요.',
    verdict: PRESCRIPTION_LABEL.PRIORITY,
    tone: 'adjust' as const,
  },
]

function startRetrospect() {
  say('user', '회고를 등록하고 싶어요!')
  step.value = 'candidate'
}

function startAnalysis() {
  say('user', '제 소비를 분석해주세요')
  say('ai', '이번 달 소비 패턴을 분석했어요. 요약해드릴게요.')
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
  say('ai', '좋아요! 어떤 거래로 회고를 시작할까요? 아래에서 선택해 주세요.')
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
  )
  step.value = 'qaSatisfaction'
}

function answer(question: string, value: string, nextStep: Step) {
  say('ai', question)
  say('user', value)
  step.value = nextStep
}

function finishRetrospect() {
  say('user', '회고 마무리하기')
  say('ai', '회고를 바탕으로 행동 조정안을 정리해봤어요.')
  step.value = 'improvement'
}

function rejectSuggestion() {
  say('user', '제안을 거절할게요')
  say('ai', '알겠어요! 필요할 때 언제든 다시 도와드릴게요 🙂')
  step.value = 'menu'
}

function goAllocate() {
  say('user', '목표 자금에 연결할게요')
  say('ai', '절감되는 금액을 목표에 연결해볼까요?')
  step.value = 'allocate'
}

function confirmAllocate() {
  say('user', `${selectedGoal.value.label}에 연결할게요`)
  say('ai', '마지막으로 이번 소비 상황을 요약해드릴게요.')
  step.value = 'analysis'
}
</script>

<template>
  <div class="flex h-full flex-col">
    <AppTopBar
      title="AI채팅"
      bell
      bell-dot
    />

    <main
      ref="thread"
      class="flex-1 space-y-3 overflow-y-auto px-4 pb-4"
    >
      <div
        v-if="history.length === 0"
        class="bg-brand/5 flex items-center gap-3 rounded-2xl p-4"
      >
        <div class="flex-1">
          <p class="text-ink font-bold">안녕하세요!<br />AI 소때잡 비서예요.</p>
          <p class="text-ink-muted mt-2 text-sm leading-relaxed">
            소비를 똑똑하게 관리할 수 있도록<br />제가 함께 도와드릴게요.
          </p>
        </div>
        <span
          class="bg-surface flex size-16 shrink-0 items-center justify-center rounded-full text-3xl"
          >🐮</span
        >
      </div>

      <template
        v-for="(entry, index) in history"
        :key="index"
      >
        <ChatBubble :role="entry.role">{{ entry.text }}</ChatBubble>
      </template>

      <template v-if="step === 'menu'">
        <div class="pt-2">
          <p class="text-ink font-bold">무엇을 도와드릴까요?</p>
          <p class="text-ink-muted mt-1 text-sm">필요한 기능을 빠르게 선택하실 수 있어요.</p>
        </div>
        <button
          type="button"
          class="border-line flex w-full items-center gap-3 rounded-2xl border p-4 text-left"
          @click="startRetrospect"
        >
          <span class="bg-brand/10 flex size-11 shrink-0 items-center justify-center rounded-full">
            <IconPencil
              :size="20"
              class="text-brand"
            />
          </span>
          <span class="flex-1">
            <span class="text-ink block font-semibold">회고 등록</span>
            <span class="text-ink-muted block text-xs">최근 소비 중 돌아볼 거래를 찾아볼게요.</span>
          </span>
          <IconChevronRight
            :size="18"
            class="text-ink-muted"
          />
        </button>
        <button
          type="button"
          class="border-line flex w-full items-center gap-3 rounded-2xl border p-4 text-left"
          @click="startAnalysis"
        >
          <span class="bg-brand/10 flex size-11 shrink-0 items-center justify-center rounded-full">
            <IconChartBar
              :size="20"
              class="text-brand"
            />
          </span>
          <span class="flex-1">
            <span class="text-ink block font-semibold">소비 분석</span>
            <span class="text-ink-muted block text-xs"
              >이번 달 소비 패턴을 분석하고 만족도 지도를 확인해요.</span
            >
          </span>
          <IconChevronRight
            :size="18"
            class="text-ink-muted"
          />
        </button>
        <button
          type="button"
          class="border-line flex w-full items-center gap-3 rounded-2xl border p-4 text-left"
          @click="startQna"
        >
          <span class="bg-brand/10 flex size-11 shrink-0 items-center justify-center rounded-full">
            <IconQuestionMark
              :size="20"
              class="text-brand"
            />
          </span>
          <span class="flex-1">
            <span class="text-ink block font-semibold">금융 지식 Q&A</span>
            <span class="text-ink-muted block text-xs"
              >금융에 대해 궁금한 점을 질문하고 쉽게 답을 받아보세요.</span
            >
          </span>
          <IconChevronRight
            :size="18"
            class="text-ink-muted"
          />
        </button>
      </template>

      <template v-else-if="step === 'candidate'">
        <ChatBubble role="ai">
          <p class="font-semibold">AI가 선정한 회고예요 📌</p>
          <p class="mt-1">
            이 거래는 반복되거나 금액이 큰 지출이에요.<br />돌아볼 가치가 있는 소비로 추천드려요! 😊
          </p>
        </ChatBubble>

        <div class="border-line ml-10 rounded-2xl border p-4">
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

        <div class="bg-surface-muted ml-10 rounded-2xl p-4">
          <p class="text-ink flex items-center gap-1.5 text-sm font-semibold">
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

        <div class="ml-10 space-y-2">
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
        <ChatBubble role="ai">이 소비는 어땠나요?</ChatBubble>
        <ChatQuickReplies
          :options="satisfactionOptions"
          @pick="(v) => answer('이 소비는 어땠나요?', v, 'qaPurpose')"
        />
      </template>

      <template v-else-if="step === 'qaPurpose'">
        <ChatBubble role="ai">이 소비의 목적은 무엇이었나요?</ChatBubble>
        <ChatQuickReplies
          :options="purposeOptions"
          @pick="(v) => answer('이 소비의 목적은 무엇이었나요?', v, 'qaCompanion')"
        />
      </template>

      <template v-else-if="step === 'qaCompanion'">
        <ChatBubble role="ai">이 소비는 누구와 함께했나요?</ChatBubble>
        <ChatQuickReplies
          :options="companionOptions"
          @pick="(v) => answer('이 소비는 누구와 함께했나요?', v, 'qaRepeat')"
        />
      </template>

      <template v-else-if="step === 'qaRepeat'">
        <ChatBubble role="ai">이 소비를 앞으로도 반복할 의향이 있나요?</ChatBubble>
        <ChatQuickReplies
          :options="repeatOptions"
          @pick="(v) => answer('이 소비를 앞으로도 반복할 의향이 있나요?', v, 'wrapup')"
        />
      </template>

      <template v-else-if="step === 'wrapup'">
        <ChatBubble role="ai">
          좋아요! 회고가 거의 완료됐어요 👏<br />저장 후 개선 방안과 맞춤 분석을 이어서
          도와드릴게요.
        </ChatBubble>
        <div class="ml-10 flex gap-2">
          <button
            type="button"
            class="border-line text-ink flex-1 rounded-2xl border py-3.5 text-sm font-semibold"
            @click="step = 'candidate'"
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
        <div class="border-line ml-10 rounded-2xl border p-4">
          <p class="text-ink font-semibold">오늘의 개선 방안</p>
          <div class="mt-3 flex items-center gap-3">
            <span class="bg-brand/10 flex size-14 shrink-0 items-center justify-center rounded-2xl">
              <IconMoonStars
                :size="26"
                class="text-brand"
                :stroke-width="1.5"
              />
            </span>
            <div>
              <p class="text-ink font-bold">심야 배달</p>
              <p class="text-ink-muted text-xs">
                밤 10시 이후 배달 주문 습관을<br />AI가 분석했어요.
              </p>
            </div>
          </div>

          <div class="mt-4 flex items-center gap-2">
            <div class="bg-surface-muted flex-1 rounded-xl p-3 text-center">
              <p class="text-ink-muted text-xs">현재 빈도</p>
              <p class="text-ink text-lg font-bold">월 {{ currentFrequency }}회</p>
            </div>
            <IconChevronRight
              :size="18"
              class="text-ink-muted shrink-0"
            />
            <div class="bg-brand/10 flex-1 rounded-xl p-3 text-center">
              <p class="text-brand text-xs">AI 제안 빈도</p>
              <p class="text-brand text-lg font-bold">월 {{ frequency }}회</p>
            </div>
          </div>

          <div class="bg-brand/5 mt-3 rounded-xl p-3">
            <p class="text-brand flex items-center gap-1.5 text-sm font-semibold">
              <IconBulb :size="15" /> 왜 이 제안이 중요할까요?
            </p>
            <p class="text-ink-muted mt-1 text-xs leading-relaxed">
              심야 배달은 불필요 지출로 이어지기 쉬우며,<br />수면과 컨디션에도 영향을 줄 수 있어요.
            </p>
          </div>

          <p class="text-ink mt-4 text-sm font-semibold">어떻게 개선할까요?</p>
          <div class="mt-2 grid grid-cols-4 gap-2">
            <button
              v-for="f in frequencyOptions"
              :key="f.target"
              type="button"
              class="rounded-xl border px-1 py-2 text-center"
              :class="
                frequency === f.target ? 'border-brand text-brand' : 'border-line text-ink-muted'
              "
              @click="frequency = f.target"
            >
              <span class="block text-[11px] font-semibold">{{ f.label }}</span>
              <span class="block text-[11px]">월 {{ f.target }}회</span>
            </button>
          </div>

          <div class="bg-surface-muted mt-4 flex items-center justify-between rounded-xl p-3">
            <span class="text-ink-muted text-xs">예상 절감액</span>
            <span class="text-brand text-lg font-extrabold">
              ₩{{ expectedSaving.toLocaleString('ko-KR')
              }}<span class="text-xs font-semibold">원 / 월</span>
            </span>
          </div>
        </div>

        <div class="ml-10 flex gap-2">
          <button
            type="button"
            class="border-brand text-brand flex-1 rounded-2xl border py-3.5 text-sm font-semibold"
            @click="rejectSuggestion"
          >
            제안 거절하기
          </button>
          <button
            type="button"
            class="bg-brand text-surface flex flex-1 items-center justify-center gap-1 rounded-2xl py-3.5 text-sm font-semibold"
            @click="goAllocate"
          >
            목표 자금 연결 <IconChevronRight :size="16" />
          </button>
        </div>
      </template>

      <template v-else-if="step === 'allocate'">
        <div class="border-line ml-10 rounded-2xl border p-4">
          <p class="text-ink text-lg font-bold">
            절감되는 {{ expectedSaving.toLocaleString('ko-KR') }}원을<br />어디에 연결할까요?
          </p>
          <p class="text-ink-muted mt-1 text-xs">선택한 목표에 이번 절감액 전액이 연결돼요.</p>

          <div class="mt-3 space-y-2">
            <button
              v-for="g in goals"
              :key="g.key"
              type="button"
              class="flex w-full items-center gap-3 rounded-2xl border p-3 text-left"
              :class="goalKey === g.key ? 'border-brand' : 'border-line'"
              @click="goalKey = g.key"
            >
              <span
                class="bg-surface-muted flex size-11 shrink-0 items-center justify-center rounded-xl"
              >
                <component
                  :is="g.icon"
                  :size="22"
                  class="text-brand"
                  :stroke-width="1.5"
                />
              </span>
              <span class="flex-1">
                <span class="text-ink block text-sm font-semibold">{{ g.label }}</span>
                <span class="text-ink-muted block text-xs">{{ g.desc }}</span>
                <span class="text-ink-muted block text-xs">
                  현재 {{ g.saved.toLocaleString('ko-KR') }}원 / 목표
                  {{ g.target.toLocaleString('ko-KR') }}원
                </span>
              </span>
              <span
                class="flex size-6 shrink-0 items-center justify-center rounded-full border"
                :class="goalKey === g.key ? 'border-brand bg-brand text-surface' : 'border-line'"
              >
                <IconCheck
                  v-if="goalKey === g.key"
                  :size="14"
                  :stroke-width="3"
                />
              </span>
            </button>
          </div>

          <div class="bg-surface-muted mt-4 rounded-2xl p-3">
            <p class="text-ink text-sm font-semibold">선택한 목표 적용 후</p>
            <p class="text-ink-muted mt-1 text-xs">{{ selectedGoal.label }}</p>
            <div class="mt-2 flex items-center gap-2">
              <div class="bg-surface flex-1 rounded-xl p-3 text-center">
                <p class="text-ink-muted text-xs">현재 달성률</p>
                <p class="text-ink text-xl font-extrabold">{{ goalBefore }}%</p>
                <p class="text-ink-muted text-xs">
                  {{ selectedGoal.saved.toLocaleString('ko-KR') }}원
                </p>
              </div>
              <IconChevronRight
                :size="18"
                class="text-ink-muted shrink-0"
              />
              <div class="bg-brand/10 flex-1 rounded-xl p-3 text-center">
                <p class="text-brand text-xs">적용 후</p>
                <p class="text-brand text-xl font-extrabold">{{ goalAfter }}%</p>
                <p class="text-brand text-xs">
                  {{ (selectedGoal.saved + expectedSaving).toLocaleString('ko-KR') }}원
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="ml-10">
          <PrimaryButton
            arrow
            @click="confirmAllocate"
            >이 목표에 연결하기</PrimaryButton
          >
        </div>
      </template>

      <template v-else-if="step === 'analysis'">
        <div class="border-line ml-10 rounded-2xl border p-4">
          <p class="text-ink font-bold">AI가 분석한<br />당신의 소비 프로필이에요</p>

          <div class="mt-3 grid grid-cols-3 gap-2">
            <div
              v-for="tag in profileTags"
              :key="tag.label"
              class="border-line rounded-2xl border p-3 text-center"
            >
              <component
                :is="tag.icon"
                :size="22"
                class="text-brand mx-auto"
                :stroke-width="1.5"
              />
              <p class="text-ink mt-2 text-xs font-bold">{{ tag.label }}</p>
              <p class="text-ink-muted mt-1 text-[11px] leading-snug">{{ tag.desc }}</p>
            </div>
          </div>

          <p class="text-ink mt-4 text-sm font-semibold">주요 소비 행동 분석</p>
          <div class="divide-line mt-1 divide-y">
            <div
              v-for="b in behaviorSummary"
              :key="b.label"
              class="flex items-center gap-3 py-3"
            >
              <span class="flex-1">
                <span class="text-ink block text-sm font-semibold">{{ b.label }}</span>
                <span class="text-ink-muted block text-xs">{{ b.desc }}</span>
              </span>
              <span
                class="rounded-lg px-2.5 py-1 text-xs font-bold"
                :class="
                  b.tone === 'sustain'
                    ? 'text-verdict-sustain bg-verdict-sustain/10'
                    : 'text-verdict-adjust bg-verdict-adjust/10'
                "
              >
                {{ b.verdict }}
              </span>
            </div>
          </div>
        </div>

        <div class="ml-10">
          <PrimaryButton
            arrow
            @click="router.push('/map')"
            >만족도 지도 보기</PrimaryButton
          >
        </div>
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
      @send="onSend"
      @shortcut="onShortcut"
    />
    <AppBottomNav />
  </div>
</template>
