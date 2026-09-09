<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconArrowRight,
  IconBell,
  IconChartBar,
  IconCheck,
  IconChevronLeft,
  IconCloudUpload,
  IconFile,
  IconSearch,
  IconX,
} from '@tabler/icons-vue'

import ChatBubble from '@/components/chat/ChatBubble.vue'
import ChatQuickReplies from '@/components/chat/ChatQuickReplies.vue'
import {
  COMPANION_OPTIONS,
  PURPOSE_OPTIONS,
  REPEAT_OPTIONS,
  SATISFACTION_OPTIONS,
  tagLabels,
  tagValue,
} from '@/components/chat/tagOptions'
import GoalDatePicker from '@/components/common/goal-date-picker.vue'
import MoneyInput from '@/components/common/MoneyInput.vue'
import goalCustom from '@/assets/images/onboarding/goal-custom.png'
import goalEmergency from '@/assets/images/onboarding/goal-emergency.png'
import goalIndependence from '@/assets/images/onboarding/goal-independence.png'
import goalTravel from '@/assets/images/onboarding/goal-travel.png'
import assistantHappy from '@/assets/images/ai/04_happy_cheeks_hat.png'
import assistantThinking from '@/assets/images/ai/05_thinking_hat.png'
import {
  completeOnboarding,
  createGoal,
  saveRetrospect,
  startOnboarding,
  updateSettings,
  uploadTransactions,
} from '@/api/service'
import type { CompanionTag, PurposeTag, Satisfaction } from '@/api/enums'
import { apiErrorMessage } from '@/api/errorMessage'
import { useUserStore } from '@/stores/user'
import { addCalendarMonths, toDateIso } from '@/utils/date'

const router = useRouter()
const userStore = useUserStore()

function initialGoalDueDate() {
  return addCalendarMonths(toDateIso(new Date()), 1)
}

const step = ref(1)
const totalSteps = 4
const goalType = ref('TRAVEL')
const goalName = ref('')
const goalAmount = ref(3_000_000)
const goalCurrentAmount = ref(0)
const goalDueDate = ref(initialGoalDueDate())
const goalDueDay = ref(Number(goalDueDate.value.slice(-2)))
const onboardingFileInput = useTemplateRef<HTMLInputElement>('onboardingFileInput')
const uploadedFile = ref<{ name: string; size: string } | null>(null)
const selectedFile = ref<File | null>(null)
const uploadError = ref('')
const saving = ref(false)
const saveError = ref('')
const savedSteps = new Set<number>()

function formatUploadSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function attachUpload(file?: File) {
  if (!file) return

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension !== 'csv' && extension !== 'xlsx') {
    uploadError.value = 'CSV 또는 XLSX 파일만 선택할 수 있어요.'
    return
  }

  uploadedFile.value = { name: file.name, size: formatUploadSize(file.size) }
  selectedFile.value = file
  uploadError.value = ''
}

function onUploadChange(event: Event) {
  attachUpload((event.target as HTMLInputElement).files?.[0])
}

function onUploadDrop(event: DragEvent) {
  attachUpload(event.dataTransfer?.files[0])
}

function removeUpload() {
  uploadedFile.value = null
  selectedFile.value = null
  uploadError.value = ''
  if (onboardingFileInput.value) onboardingFileInput.value.value = ''
}
const monthlyBudget = ref(2_500_000)
type AnalysisSensitivity = 'RELAXED' | 'BALANCED' | 'DETAILED'
const sensitivity = ref<AnalysisSensitivity | null>('BALANCED')
const outlierThreshold = ref(100_000)

type ReviewStage = 'satisfaction' | 'purpose' | 'companion' | 'repeat' | 'complete'
type ReviewAnswer = {
  satisfaction?: Satisfaction
  purpose?: PurposeTag
  companion?: CompanionTag
}
type ReviewMessage = { role: 'ai' | 'user'; text: string }
type ReviewRecord = {
  transactionId: number
  answers: ReviewAnswer
  messages: ReviewMessage[]
}

const reviewTransactions = ref([
  {
    id: 1,
    badge: '배민',
    merchant: '배달의민족',
    amount: 23_000,
    when: '금요일 23:12',
    tags: ['심야', '반복'],
  },
  {
    id: 2,
    badge: '요기요',
    merchant: '요기요',
    amount: 19_500,
    when: '금요일 21:03',
    tags: ['배달', '반복'],
  },
  {
    id: 3,
    badge: '스타',
    merchant: '스타벅스',
    amount: 6_200,
    when: '금요일 16:45',
    tags: ['카페', '반복'],
  },
  {
    id: 4,
    badge: 'GS',
    merchant: 'GS25',
    amount: 4_500,
    when: '목요일 23:19',
    tags: ['심야', '편의점'],
  },
  {
    id: 5,
    badge: '교촌',
    merchant: '교촌치킨',
    amount: 21_000,
    when: '목요일 21:55',
    tags: ['배달'],
  },
  { id: 6, badge: 'CU', merchant: 'CU', amount: 3_200, when: '목요일 20:10', tags: ['편의점'] },
  {
    id: 7,
    badge: '택시',
    merchant: '카카오 T',
    amount: 18_400,
    when: '수요일 00:18',
    tags: ['심야', '택시'],
  },
  { id: 8, badge: '쿠팡', merchant: '쿠팡', amount: 54_900, when: '화요일 22:06', tags: ['쇼핑'] },
  {
    id: 9,
    badge: '올영',
    merchant: '올리브영',
    amount: 37_500,
    when: '월요일 18:42',
    tags: ['쇼핑'],
  },
  {
    id: 10,
    badge: '메가',
    merchant: '메가커피',
    amount: 5_300,
    when: '월요일 13:20',
    tags: ['카페'],
  },
])

const reviewIndex = ref(0)
const reviewStage = ref<ReviewStage>('satisfaction')
const reviewRecords = ref<ReviewRecord[]>([])
const reviewMessages = ref<ReviewMessage[]>([])
const reviewAnswers = ref<ReviewAnswer>({})
const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer')

function updateGoalDueDate(value: string) {
  goalDueDate.value = value
  goalDueDay.value = Number(value.slice(-2))
}

function addGoalMonths(months: number) {
  goalDueDate.value = addCalendarMonths(goalDueDate.value, months, goalDueDay.value)
}

function scrollCalendarIntoView(isOpen: boolean) {
  if (!isOpen) return
  void nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTo({
        top: scrollContainer.value.scrollHeight,
        behavior: 'smooth',
      })
    }
  })
}

const currentReviewTransaction = computed(() => reviewTransactions.value[reviewIndex.value]!)
const completedReviewCount = computed(() => reviewRecords.value.length)
const reviewProgress = computed(
  () => (completedReviewCount.value / reviewTransactions.value.length) * 100,
)
const allReviewsComplete = computed(
  () =>
    reviewTransactions.value.length > 0 &&
    completedReviewCount.value === reviewTransactions.value.length,
)
const hasReviewCandidates = computed(() => reviewTransactions.value.length > 0)
const reviewOptions = computed<readonly string[]>(() => {
  if (reviewStage.value === 'satisfaction') return tagLabels(SATISFACTION_OPTIONS)
  if (reviewStage.value === 'purpose') return tagLabels(PURPOSE_OPTIONS)
  if (reviewStage.value === 'companion') return tagLabels(COMPANION_OPTIONS)
  if (reviewStage.value === 'repeat') return tagLabels(REPEAT_OPTIONS)
  return []
})

function reviewQuestion(stage: ReviewStage) {
  if (stage === 'satisfaction') return '이 소비는 어땠나요?'
  if (stage === 'purpose') return '이 소비의 목적은 무엇이었나요?'
  if (stage === 'companion') return '이 소비는 누구와 함께했나요?'
  return '이 소비를 앞으로도 반복할 의향이 있나요?'
}

function beginReview() {
  const transaction = currentReviewTransaction.value
  reviewStage.value = 'satisfaction'
  reviewAnswers.value = {}
  reviewMessages.value = [
    {
      role: 'ai',
      text:
        reviewIndex.value === 0
          ? '좋아요! 최근 소비 몇 개만 함께 돌아보며 소비 성향을 학습할게요 😊'
          : '좋아요! ' +
            transaction.merchant +
            ' ' +
            transaction.amount.toLocaleString('ko-KR') +
            '원에 대해 함께 돌아볼까요? 😊',
    },
    { role: 'ai', text: reviewQuestion('satisfaction') },
  ]
}

async function answerReview(value: string) {
  if (reviewStage.value === 'complete') return
  reviewMessages.value.push({ role: 'user', text: value })

  if (reviewStage.value === 'satisfaction') {
    reviewAnswers.value.satisfaction = tagValue(SATISFACTION_OPTIONS, value)
    reviewStage.value = 'purpose'
  } else if (reviewStage.value === 'purpose') {
    reviewAnswers.value.purpose = tagValue(PURPOSE_OPTIONS, value)
    reviewStage.value = 'companion'
  } else if (reviewStage.value === 'companion') {
    reviewAnswers.value.companion = tagValue(COMPANION_OPTIONS, value)
    reviewStage.value = 'repeat'
  } else if (reviewStage.value === 'repeat') {
    const repeatIntent = tagValue(REPEAT_OPTIONS, value)
    saving.value = true
    saveError.value = ''
    try {
      await saveRetrospect({
        transactionId: currentReviewTransaction.value.id,
        satisfaction: reviewAnswers.value.satisfaction ?? 'UNKNOWN',
        purpose: reviewAnswers.value.purpose ?? '기타',
        companion: reviewAnswers.value.companion ?? '기타',
        repeatIntent,
        source: 'ONBOARDING',
      })
      reviewStage.value = 'complete'
      reviewMessages.value.push({ role: 'ai', text: '좋아요! 회고가 완료됐어요 👏' })
      reviewRecords.value.push({
        transactionId: currentReviewTransaction.value.id,
        answers: { ...reviewAnswers.value },
        messages: reviewMessages.value.map((message) => ({ ...message })),
      })
    } catch (error) {
      saveError.value = apiErrorMessage(error, '회고를 저장하지 못했어요. 다시 시도해주세요.')
    } finally {
      saving.value = false
    }
    return
  } else {
    // 단계를 더하고 분기를 빠뜨리면 여기서 type-check가 실패한다.
    const unhandled: never = reviewStage.value
    return unhandled
  }

  reviewMessages.value.push({ role: 'ai', text: reviewQuestion(reviewStage.value) })
}

async function continueReviews() {
  if (reviewStage.value !== 'complete') return
  if (allReviewsComplete.value) {
    await finishOnboarding()
    return
  }
  reviewIndex.value += 1
  beginReview()
}

async function finishOnboarding() {
  if (saving.value) return
  saving.value = true
  saveError.value = ''
  try {
    await completeOnboarding()
    // 이 갱신이 없으면 홈으로 이동하는 순간 진입 가드가 다시 온보딩으로 되돌린다.
    userStore.markOnboardingCompleted()
    await router.push('/')
  } catch (error) {
    saveError.value = apiErrorMessage(error, '온보딩을 완료하지 못했어요. 다시 시도해주세요.')
  } finally {
    saving.value = false
  }
}

watch(
  [reviewMessages, reviewStage],
  () => {
    void nextTick(() => {
      if (scrollContainer.value)
        scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    })
  },
  { deep: true },
)

const goalTypes = [
  { value: 'TRAVEL', label: '여행', image: goalTravel },
  { value: 'EMERGENCY', label: '비상금', image: goalEmergency },
  { value: 'INDEPENDENCE', label: '독립', image: goalIndependence },
  { value: 'CUSTOM', label: '직접 입력', image: goalCustom },
]
const sensitivityOptions = [
  {
    value: 'RELAXED',
    title: '여유 있게',
    desc: '정말 큰 지출만 알려드려요',
    amount: '15만원 이상',
    threshold: 150_000,
    icon: IconChartBar,
  },
  {
    value: 'BALANCED',
    title: '균형 있게',
    desc: '평소와 다른 지출을 알려드려요',
    amount: '10만원 이상',
    threshold: 100_000,
    icon: IconBell,
  },
  {
    value: 'DETAILED',
    title: '꼼꼼하게',
    desc: '작은 변화도 알려드려요',
    amount: '5만원 이상',
    threshold: 50_000,
    icon: IconSearch,
  },
] as const

function selectSensitivity(option: (typeof sensitivityOptions)[number]) {
  sensitivity.value = option.value
  outlierThreshold.value = option.threshold
}

function setCustomThreshold(value: number) {
  outlierThreshold.value = value
  sensitivity.value = null
}
const canProceed = computed(() => {
  if (step.value === 3) return uploadedFile.value !== null
  if (step.value === 1 && goalType.value === 'CUSTOM' && goalName.value.trim() === '') return false
  if (step.value === 2) return monthlyBudget.value > 0 && outlierThreshold.value > 0
  return goalAmount.value > 0
})

function onGoalNameInput(event: Event) {
  const input = event.target as HTMLInputElement
  const sanitized = Array.from(input.value.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s]/g, ''))
    .slice(0, 9)
    .join('')
  goalName.value = sanitized
  input.value = sanitized
}
async function next() {
  if (step.value >= totalSteps) return
  saving.value = true
  saveError.value = ''
  try {
    if (step.value === 1 && !savedSteps.has(1)) {
      const selectedGoal = goalTypes.find((goal) => goal.value === goalType.value)
      await createGoal({
        name:
          goalType.value === 'CUSTOM'
            ? goalName.value.trim()
            : `${selectedGoal?.label ?? '소비'} 자금`,
        targetAmount: goalAmount.value,
        targetDate: goalDueDate.value,
        currentAmount: goalCurrentAmount.value,
      })
      savedSteps.add(1)
    } else if (step.value === 2 && !savedSteps.has(2)) {
      const me = await updateSettings({
        monthlyBudget: monthlyBudget.value,
        outlierThreshold: outlierThreshold.value,
        retrospectDelayDays: 1,
      })
      userStore.replaceMe(me)
      savedSteps.add(2)
    } else if (step.value === 3 && !savedSteps.has(3)) {
      if (!selectedFile.value) return
      const result = await uploadTransactions(selectedFile.value)
      const candidates = await startOnboarding({
        sampleSize: reviewTransactions.value.length,
        periodFrom: result.periodFrom,
        periodTo: result.periodTo,
      })
      reviewTransactions.value = candidates.map((candidate) => ({
        id: candidate.transactionId,
        badge: candidate.merchant.slice(0, 2),
        merchant: candidate.merchant,
        amount: candidate.amount,
        when: new Intl.DateTimeFormat('ko-KR', {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date(candidate.occurredAt)),
        tags: [candidate.category, candidate.timeSlot],
      }))
      savedSteps.add(3)
    }
    step.value += 1
    if (
      step.value === totalSteps &&
      hasReviewCandidates.value &&
      reviewMessages.value.length === 0
    ) {
      beginReview()
    }
  } catch (error) {
    saveError.value = apiErrorMessage(error, '입력 내용을 저장하지 못했어요. 다시 시도해주세요.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div
    class="bg-surface mx-auto flex h-full min-h-[844px] w-full max-w-[390px] flex-col overflow-hidden"
  >
    <header class="flex h-12 shrink-0 items-center justify-between px-5">
      <button
        type="button"
        class="text-ink flex size-6 items-center justify-center"
        aria-label="이전"
        :disabled="true"
      >
        <IconChevronLeft
          :size="24"
          :class="step === 1 ? 'opacity-100' : ''"
        />
      </button>
      <div class="flex w-24 gap-1.5">
        <span
          v-for="n in totalSteps"
          :key="n"
          class="h-1.5 flex-1 rounded-full"
          :class="n <= step ? 'bg-brand' : 'bg-progress-track'"
        ></span>
      </div>
      <span class="text-ink-faint w-6 text-right text-sm font-bold">{{ step }}/4</span>
    </header>

    <main
      ref="scrollContainer"
      class="min-h-0 flex-1 overflow-y-auto px-6 pt-5"
    >
      <section
        v-if="step === 1"
        class="space-y-6"
      >
        <div class="space-y-2">
          <h1 class="text-ink text-[22px] leading-normal font-bold">
            어떤 목표를 위해 저축하고 싶나요?
          </h1>
          <p class="text-ink-muted text-sm">목표에 맞춤 분석과 코칭을 제공해드려요.</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="goal in goalTypes"
            :key="goal.value"
            type="button"
            class="relative flex h-[143px] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border p-4"
            :class="goalType === goal.value ? 'border-2 border-brand' : 'border-line'"
            @click="goalType = goal.value"
          >
            <span
              v-if="goalType === goal.value"
              class="bg-brand text-surface absolute top-2.5 right-2.5 flex size-[18px] items-center justify-center rounded-full"
              ><IconCheck
                :size="11"
                :stroke-width="3"
            /></span>
            <img
              :src="goal.image"
              alt=""
              class="size-[88px] object-contain"
            />
            <span class="text-ink text-[15px] font-bold">{{ goal.label }}</span>
          </button>
        </div>
        <div
          v-if="goalType === 'CUSTOM'"
          class="space-y-2"
        >
          <label
            for="custom-goal-name"
            class="text-ink-muted text-[13px] font-bold"
          >
            목표 이름
          </label>
          <input
            id="custom-goal-name"
            :value="goalName"
            type="text"
            maxlength="9"
            aria-label="목표 이름"
            placeholder="예: 자동차 구매"
            class="border-brand text-ink placeholder:text-ink-faint bg-surface h-[52px] w-full rounded-xl border px-4 text-lg font-bold outline-none placeholder:text-sm placeholder:font-normal"
            @input="onGoalNameInput"
          />
          <p class="text-ink-faint text-right text-[11px]">{{ goalName.length }}/9</p>
        </div>
        <div class="space-y-2">
          <label class="text-ink-muted text-[13px] font-bold">목표 금액</label>
          <MoneyInput
            v-model="goalAmount"
            accent
          />
          <div class="flex gap-2">
            <button
              v-for="amount in [100_000, 500_000, 1_000_000]"
              :key="amount"
              type="button"
              class="border-line text-ink-muted rounded-full border px-3 py-2 text-xs font-medium"
              @click="goalAmount += amount"
            >
              +{{ amount / 10_000 }}만
            </button>
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-ink-muted text-[13px] font-bold">지금까지 모은 금액</label>
          <MoneyInput v-model="goalCurrentAmount" />
        </div>
        <div class="space-y-2">
          <label class="text-ink-muted text-[13px] font-bold">목표 달성 예정일</label>
          <GoalDatePicker
            :model-value="goalDueDate"
            @update:model-value="updateGoalDueDate"
            @open-change="scrollCalendarIntoView"
          />
          <div class="flex gap-2">
            <button
              v-for="months in [3, 6, 12]"
              :key="months"
              type="button"
              class="border-line text-ink-muted flex-1 rounded-full border py-2 text-xs font-medium"
              @click="addGoalMonths(months)"
            >
              +{{ months }}개월
            </button>
          </div>
        </div>
      </section>

      <section
        v-else-if="step === 2"
        class="space-y-6"
      >
        <div class="space-y-2">
          <h1 class="text-ink text-[22px] leading-[1.2] font-bold">
            한 달 예산과 분석 기준을<br />설정해볼까요?
          </h1>
          <p class="text-ink-muted text-sm">나에게 딱 맞는 분석으로 도와드릴게요.</p>
        </div>
        <div class="space-y-2">
          <label class="text-ink-muted text-[13px] font-bold">월 예산 (필수)</label
          ><MoneyInput v-model="monthlyBudget" />
          <p class="text-ink-faint text-[11px]">정확한 분석을 위해 월 예산은 입력해 주세요.</p>
        </div>
        <div class="space-y-2">
          <p class="text-ink text-[13px] font-bold">평소와 다른 지출 알림</p>
          <p class="text-ink-muted text-xs">거래내역을 바탕으로 평균보다 큰 결제를 감지해요.</p>
          <div class="border-brand bg-brand-soft rounded-xl border p-3.5">
            <span class="bg-brand text-surface rounded-md px-2 py-1 text-[10px] font-bold"
              >추천 기준</span
            >
            <p class="text-ink mt-2 text-xs font-bold">평균 결제보다 많이 큰 금액</p>
            <p class="text-ink-faint mt-1 text-[10px]">
              예: 평균 2~3만원 사용 → 10만원 이상 결제 시 알림
            </p>
          </div>
        </div>
        <div class="space-y-2.5">
          <p class="text-ink text-[13px] font-bold">어느 정도 차이부터 알려드릴까요?</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="option in sensitivityOptions"
              :key="option.value"
              type="button"
              class="relative flex h-[119px] flex-col items-center rounded-xl border px-2 py-3 text-center"
              :class="sensitivity === option.value ? 'border-2 border-brand' : 'border-line'"
              @click="selectSensitivity(option)"
            >
              <span
                v-if="sensitivity === option.value"
                class="bg-brand text-surface absolute top-2 right-2 flex size-3.5 items-center justify-center rounded-full"
                ><IconCheck :size="8" /></span
              ><component
                :is="option.icon"
                :size="24"
                :class="sensitivity === option.value ? 'text-brand' : 'text-ink-faint'"
              /><b class="text-ink mt-1 text-xs">{{ option.title }}</b
              ><span class="text-ink-faint mt-1 text-[9px] leading-[1.2]">{{ option.desc }}</span
              ><span
                class="bg-surface-muted text-ink-faint mt-auto rounded-md px-2 py-1 text-[9px] font-bold"
                :class="sensitivity === option.value ? 'bg-brand-soft text-brand' : ''"
                >{{ option.amount }}</span
              >
            </button>
          </div>
        </div>
        <div class="space-y-2.5">
          <label class="text-ink text-[13px] font-bold">기준 금액 직접 설정</label>
          <MoneyInput
            :model-value="outlierThreshold"
            @update:model-value="setCustomThreshold"
          />
          <div class="flex gap-2">
            <button
              v-for="amount in [50_000, 100_000, 500_000, 1_000_000]"
              :key="amount"
              type="button"
              class="border-line text-ink-muted flex-1 rounded-full border py-2 text-xs font-medium"
              @click="setCustomThreshold(outlierThreshold + amount)"
            >
              +{{ amount / 10_000 }}만원
            </button>
          </div>
        </div>
      </section>

      <section
        v-else-if="step === 3"
        class="space-y-6"
      >
        <div class="space-y-2">
          <h1 class="text-ink text-[22px] leading-[1.2] font-bold">
            거래내역을 업로드해<br />분석을 시작할게요
          </h1>
          <p class="text-ink-muted text-sm">
            카드 거래내역 파일을 업로드하면 소비 패턴을 분석하고 결과를 보여줘요.
          </p>
        </div>
        <div class="space-y-2.5">
          <p class="text-ink-muted text-[13px] font-bold">파일 업로드</p>
          <div
            class="border-brand flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed p-5"
            @dragover.prevent
            @drop.prevent="onUploadDrop"
          >
            <span
              class="bg-brand-soft text-brand flex size-10 items-center justify-center rounded-full"
              ><IconCloudUpload :size="20"
            /></span>
            <span class="text-ink text-center text-xs leading-[1.5] font-bold"
              >거래내역 파일을 드래그하거나<br />파일을 선택하세요.</span
            >
            <span class="text-ink-faint text-[10px]">CSV, XLSX 파일 지원</span>
            <input
              ref="onboardingFileInput"
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              class="hidden"
              @change="onUploadChange"
            />
            <button
              type="button"
              class="border-line text-ink-muted rounded-lg border px-4 py-2 text-[11px] font-bold"
              @click="onboardingFileInput?.click()"
            >
              파일 선택
            </button>
          </div>
          <p
            v-if="uploadError"
            class="text-brand px-1 text-[11px]"
          >
            {{ uploadError }}
          </p>
          <div
            v-if="uploadedFile"
            class="border-line flex h-[52px] items-center justify-between rounded-xl border px-3"
          >
            <div class="flex items-center gap-2">
              <IconFile
                class="text-ink-faint"
                :size="20"
              />
              <div>
                <p class="text-ink text-xs font-bold">{{ uploadedFile.name }}</p>
                <p class="text-ink-faint text-[10px]">{{ uploadedFile.size }}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="파일 제거"
              @click="removeUpload"
            >
              <IconX
                class="text-ink-faint"
                :size="16"
              />
            </button>
          </div>
        </div>
        <div class="text-ink-faint space-y-1.5 text-[11px]">
          <p>· 최근 12개월 이내 거래내역 파일을 권장해요.</p>
          <p>· 개인 정보는 분석 완료 후 즉시 안전하게 파기돼요.</p>
        </div>
      </section>

      <section
        v-else-if="hasReviewCandidates"
        class="space-y-3 pb-3"
      >
        <div>
          <h1 class="text-ink text-[22px] leading-[1.2] font-bold">
            소비 경험을<br />함께 기록하고 있어요
          </h1>
          <p class="text-ink-muted mt-2 text-xs">
            더 정확한 분석을 위해 최근 소비 몇 개만 함께 회고해볼까요?
          </p>
        </div>

        <div class="flex justify-between text-xs font-bold">
          <span class="text-ink-muted">표본 회고 진행</span>
          <span class="text-brand"
            >{{ completedReviewCount }} / {{ reviewTransactions.length }}</span
          >
        </div>
        <div
          class="bg-progress-track h-2 overflow-hidden rounded-full"
          role="progressbar"
          aria-label="표본 회고 진행률"
          :aria-valuenow="completedReviewCount"
          :aria-valuemax="reviewTransactions.length"
        >
          <div
            class="bg-brand h-full rounded-full transition-[width] duration-300"
            :style="{ width: reviewProgress + '%' }"
          />
        </div>

        <div class="border-line rounded-2xl border p-3">
          <p class="text-ink-faint text-[11px]">이번 회고 거래</p>
          <div class="mt-2 flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="bg-satisfaction-high text-surface flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
              >
                {{ currentReviewTransaction.badge }}
              </span>
              <div class="min-w-0">
                <p class="text-ink truncate font-bold">{{ currentReviewTransaction.merchant }}</p>
                <p class="text-ink-faint text-[11px]">{{ currentReviewTransaction.when }}</p>
              </div>
            </div>
            <b class="text-ink shrink-0 text-xl">
              {{ currentReviewTransaction.amount.toLocaleString('ko-KR') }}원
            </b>
          </div>
          <div class="mt-2 flex gap-2">
            <span
              v-for="tag in currentReviewTransaction.tags"
              :key="tag"
              class="bg-brand-soft text-brand rounded-md px-2 py-1 text-[10px]"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div
          aria-live="polite"
          class="space-y-3 pt-1"
        >
          <ChatBubble
            v-for="(message, index) in reviewMessages"
            :key="index"
            :role="message.role"
            :avatar="
              index === 0 || message.text.includes('완료') ? assistantHappy : assistantThinking
            "
          >
            {{ message.text }}
          </ChatBubble>
        </div>

        <ChatQuickReplies
          v-if="reviewStage !== 'complete'"
          :options="reviewOptions"
          @pick="answerReview"
        />
      </section>
      <section
        v-else
        class="flex h-full flex-col items-center justify-center gap-3 pb-16 text-center"
      >
        <span
          class="bg-brand-soft text-brand flex size-14 items-center justify-center rounded-full"
        >
          <IconCheck :size="28" />
        </span>
        <h1 class="text-ink text-xl font-bold">지금 회고할 거래가 없어요</h1>
        <p class="text-ink-muted text-sm leading-relaxed">
          목표와 거래내역, 분석 설정은 모두 저장됐어요.<br />바로 홈에서 소비 지도를 확인해보세요.
        </p>
      </section>
    </main>

    <footer class="bg-surface flex shrink-0 gap-2.5 px-5 pt-4 pb-8">
      <button
        v-if="step === 4 && hasReviewCandidates"
        type="button"
        class="border-brand text-ink h-[52px] flex-1 rounded-2xl border text-sm font-bold"
        :disabled="saving"
        @click="finishOnboarding"
      >
        나중에 회고하기
      </button>
      <button
        v-if="step === 4 && hasReviewCandidates"
        type="button"
        class="bg-brand text-surface flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-bold disabled:opacity-40"
        :disabled="reviewStage !== 'complete' || saving"
        @click="continueReviews"
      >
        {{ allReviewsComplete ? '홈으로 가기' : '다음 소비 이어하기' }}
        <IconArrowRight :size="18" />
      </button>
      <button
        v-if="step === 4 && !hasReviewCandidates"
        type="button"
        class="bg-brand text-surface h-[52px] w-full rounded-2xl text-sm font-bold disabled:opacity-40"
        :disabled="saving"
        @click="finishOnboarding"
      >
        홈으로 가기
      </button>
      <button
        v-if="step !== 4"
        type="button"
        class="bg-brand text-surface flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold disabled:opacity-40"
        :disabled="!canProceed || saving"
        @click="next"
      >
        다음 단계로
        <IconArrowRight :size="18" />
      </button>
      <p
        v-if="saveError"
        role="alert"
        class="text-brand absolute bottom-2 left-5 text-xs"
      >
        {{ saveError }}
      </p>
    </footer>
  </div>
</template>
