<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconAdjustmentsHorizontal,
  IconBeach,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCreditCard,
  IconFileSpreadsheet,
  IconHome,
  IconLeaf,
  IconMoonStars,
  IconPencil,
  IconRepeat,
  IconSettings,
  IconShieldLock,
  IconTarget,
  IconUpload,
  IconUsers,
} from '@tabler/icons-vue'

import type { CardIssuer, Satisfaction } from '@/api/enums'
import MerchantBadge from '@/components/common/MerchantBadge.vue'
import MoneyInput from '@/components/common/MoneyInput.vue'
import PrimaryButton from '@/components/common/PrimaryButton.vue'
import SatisfactionPicker from '@/components/common/SatisfactionPicker.vue'

const router = useRouter()
const step = ref(1)
const totalSteps = 4

type GoalType = 'TRAVEL' | 'EMERGENCY' | 'INDEPENDENCE' | 'CUSTOM'
const goalTypes: { value: GoalType; label: string; sub: string; icon: typeof IconBeach }[] = [
  { value: 'TRAVEL', label: '여행', sub: '여행 경비 마련', icon: IconBeach },
  { value: 'EMERGENCY', label: '비상금', sub: '예상치 못한 지출 대비', icon: IconShieldLock },
  { value: 'INDEPENDENCE', label: '독립', sub: '보증금, 월세 등 마련', icon: IconHome },
  { value: 'CUSTOM', label: '직접 입력', sub: '직접 목표를 설정할게요', icon: IconPencil },
]
const goalType = ref<GoalType | null>('TRAVEL')
const goalAmount = ref(3_000_000)
const amountInput = useTemplateRef('amountInput')

function addAmount(delta: number) {
  goalAmount.value += delta
}

const monthlyBudget = ref(2_500_000)

type Sensitivity = 'CONSERVATIVE' | 'BASIC' | 'SENSITIVE'
const sensitivities: { value: Sensitivity; label: string; sub: string; icon: typeof IconLeaf }[] = [
  { value: 'CONSERVATIVE', label: '보수적으로', sub: '지출을 넉넉하게 평가해요', icon: IconLeaf },
  {
    value: 'BASIC',
    label: '기본',
    sub: '일반적인 기준으로 분석해요',
    icon: IconAdjustmentsHorizontal,
  },
  { value: 'SENSITIVE', label: '민감하게', sub: '작은 지출도 꼼꼼히 잡아줘요', icon: IconTarget },
]
const sensitivity = ref<Sensitivity>('BASIC')

const cardIssuers: { value: CardIssuer; label: string }[] = [
  { value: 'KB', label: 'KB국민카드' },
  { value: 'HANA', label: '하나카드' },
  { value: 'SHINHAN', label: '신한카드' },
]
const selectedCard = ref<CardIssuer>('KB')
const uploadedFileName = ref<string | null>(null)

function pickFile() {
  uploadedFileName.value = '2025_08_카드_거래내역.xlsx'
}

const satisfaction = ref<Satisfaction | null>(null)
const purposeOptions = ['식사', '만남·사교', '휴식·취미', '필수품', '자기계발', '충동', '기타']
const companionOptions = ['혼자', '친구', '가족', '연인', '동료', '기타']
const repeatOptions = ['줄여볼게요', '유지할게요', '늘려볼게요']
const purpose = ref(purposeOptions[0]!)
const companion = ref(companionOptions[0]!)
const repeatIntent = ref(repeatOptions[0]!)

function nextOption(list: string[], current: string) {
  return list[(list.indexOf(current) + 1) % list.length]!
}

const canProceed = computed(() => {
  if (step.value === 1) return goalType.value !== null && goalAmount.value > 0
  return true
})

function next() {
  if (step.value < totalSteps) {
    step.value += 1
    return
  }
  void router.push('/')
}
</script>

<template>
  <div class="flex h-full flex-col">
    <header class="flex h-14 shrink-0 items-center justify-between px-4">
      <button
        type="button"
        class="text-ink -ml-2 flex size-9 items-center justify-center disabled:opacity-30"
        :disabled="step === 1"
        aria-label="이전 단계"
        @click="step -= 1"
      >
        <IconChevronLeft :size="22" />
      </button>
      <div class="mx-3 flex flex-1 items-center gap-1.5">
        <template
          v-for="n in totalSteps"
          :key="n"
        >
          <span
            class="h-1.5 flex-1 rounded-full"
            :class="n <= step ? 'bg-brand' : 'bg-surface-muted'"
          ></span>
        </template>
      </div>
      <span class="text-ink-muted w-10 text-right text-xs font-medium"
        >{{ step }}/{{ totalSteps }}</span
      >
      <RouterLink
        to="/me"
        class="text-ink ml-1 flex size-9 items-center justify-center"
        aria-label="설정"
      >
        <IconSettings :size="20" />
      </RouterLink>
    </header>

    <main class="flex-1 space-y-6 overflow-y-auto px-5 pb-6">
      <section
        v-if="step === 1"
        class="space-y-6"
      >
        <div>
          <h1 class="text-ink text-xl font-bold">어떤 목표를 위해<br />저축하고 싶나요?</h1>
          <p class="text-ink-muted mt-2 text-sm">목표에 맞춤 분석과 코칭을 제공해드려요.</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="g in goalTypes"
            :key="g.value"
            type="button"
            class="relative flex flex-col items-center gap-2 rounded-2xl border p-4"
            :class="goalType === g.value ? 'border-brand' : 'border-line'"
            @click="goalType = g.value"
          >
            <span
              v-if="goalType === g.value"
              class="bg-brand text-surface absolute top-2 right-2 flex size-5 items-center justify-center rounded-full"
            >
              <IconCheck
                :size="12"
                :stroke-width="3"
              />
            </span>
            <span class="bg-surface-muted flex size-14 items-center justify-center rounded-full">
              <component
                :is="g.icon"
                :size="28"
                class="text-brand"
                :stroke-width="1.5"
              />
            </span>
            <span class="text-ink text-sm font-semibold">{{ g.label }}</span>
            <span class="text-ink-muted text-center text-xs">{{ g.sub }}</span>
          </button>
        </div>

        <div class="space-y-2">
          <span class="text-ink text-sm font-semibold">목표 금액</span>
          <MoneyInput
            ref="amountInput"
            v-model="goalAmount"
          />
          <div class="flex gap-2">
            <button
              type="button"
              class="border-line text-ink-muted rounded-full border px-3 py-1.5 text-xs font-medium"
              @click="addAmount(100_000)"
            >
              +10만
            </button>
            <button
              type="button"
              class="border-line text-ink-muted rounded-full border px-3 py-1.5 text-xs font-medium"
              @click="addAmount(500_000)"
            >
              +50만
            </button>
            <button
              type="button"
              class="border-line text-ink-muted rounded-full border px-3 py-1.5 text-xs font-medium"
              @click="addAmount(1_000_000)"
            >
              +100만
            </button>
            <button
              type="button"
              class="border-line text-ink-muted rounded-full border px-3 py-1.5 text-xs font-medium"
              @click="amountInput?.$el.querySelector('input')?.focus()"
            >
              직접 입력
            </button>
          </div>
        </div>
      </section>

      <section
        v-else-if="step === 2"
        class="space-y-6"
      >
        <div>
          <h1 class="text-ink text-xl font-bold">한 달 예산과 분석 민감도를<br />설정해볼까요?</h1>
          <p class="text-ink-muted mt-2 text-sm">나에게 딱 맞는 분석으로 도와드릴게요.</p>
        </div>

        <div class="space-y-2">
          <span class="text-ink text-sm font-semibold"
            >월 예산 <span class="text-ink-muted font-normal">(선택)</span></span
          >
          <MoneyInput v-model="monthlyBudget" />
          <p class="text-ink-muted text-xs">정확한 분석을 위해 월 예산을 입력해 주세요.</p>
        </div>

        <div class="space-y-2">
          <span class="text-ink text-sm font-semibold">분석 민감도 설정</span>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="s in sensitivities"
              :key="s.value"
              type="button"
              class="relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center"
              :class="sensitivity === s.value ? 'border-brand bg-brand/5' : 'border-line'"
              @click="sensitivity = s.value"
            >
              <span
                v-if="sensitivity === s.value"
                class="bg-brand text-surface absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full"
              >
                <IconCheck
                  :size="10"
                  :stroke-width="3"
                />
              </span>
              <component
                :is="s.icon"
                :size="22"
                class="text-brand"
                :stroke-width="1.5"
              />
              <span class="text-ink text-xs font-semibold">{{ s.label }}</span>
              <span class="text-ink-muted text-[11px] leading-snug">{{ s.sub }}</span>
            </button>
          </div>
        </div>
      </section>

      <section
        v-else-if="step === 3"
        class="space-y-6"
      >
        <div>
          <h1 class="text-ink text-xl font-bold">
            거래내역을 업로드해<br />AI가 분석을 시작할게요
          </h1>
          <p class="text-ink-muted mt-2 text-sm">
            카드 거래내역 파일을 업로드하면<br />AI가 소비 패턴을 인식하고 분석을 시작해요.
          </p>
        </div>

        <div class="space-y-2">
          <span class="text-ink text-sm font-semibold"
            >카드 선택 <span class="text-ink-muted font-normal">(선택)</span></span
          >
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="c in cardIssuers"
              :key="c.value"
              type="button"
              class="relative flex flex-col items-center gap-2 rounded-2xl border py-4"
              :class="selectedCard === c.value ? 'border-brand' : 'border-line'"
              @click="selectedCard = c.value"
            >
              <span
                v-if="selectedCard === c.value"
                class="bg-brand text-surface absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full"
              >
                <IconCheck
                  :size="10"
                  :stroke-width="3"
                />
              </span>
              <IconCreditCard
                :size="24"
                class="text-brand"
              />
              <span class="text-ink text-xs font-semibold">{{ c.label }}</span>
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <span class="text-ink text-sm font-semibold">거래내역 파일 업로드</span>
          <div class="border-line rounded-2xl border border-dashed px-4 py-8 text-center">
            <IconUpload
              :size="28"
              class="text-brand mx-auto"
              :stroke-width="1.5"
            />
            <p class="text-ink-muted mt-3 text-sm">CSV 또는 XLSX 파일을 드래그하거나 선택하세요</p>
            <button
              type="button"
              class="border-line text-ink mt-3 rounded-full border px-4 py-1.5 text-sm font-medium"
              @click="pickFile"
            >
              파일 선택
            </button>
            <div
              v-if="uploadedFileName"
              class="border-line bg-surface-muted mt-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-left"
            >
              <IconFileSpreadsheet
                :size="18"
                class="text-verdict-sustain shrink-0"
              />
              <span class="text-ink truncate text-xs">{{ uploadedFileName }}</span>
            </div>
          </div>
          <ul class="text-ink-muted list-disc space-y-1 pl-4 text-xs">
            <li>최근 12개월 이내 거래내역 파일을 권장해요.</li>
            <li>개인정보는 분석 완료 후 즉시 안전하게 삭제돼요.</li>
          </ul>
        </div>
      </section>

      <section
        v-else
        class="space-y-6"
      >
        <div>
          <h1 class="text-ink text-xl font-bold">AI가 당신의 소비 성향을<br />학습하고 있어요</h1>
          <p class="text-ink-muted mt-2 text-sm">
            더 정확한 분석을 위해 소비 경험을 함께 회고해볼까요?
          </p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-ink font-semibold">학습 진행 상황</span>
            <span class="text-ink-muted">20 / 20</span>
          </div>
          <div class="bg-surface-muted h-2 w-full rounded-full">
            <div class="bg-brand h-2 w-full rounded-full"></div>
          </div>
        </div>

        <div class="space-y-2">
          <span class="text-ink-muted text-sm font-semibold">현재 분석 중인 거래</span>
          <div class="border-line rounded-2xl border p-4">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <MerchantBadge name="배달의민족" />
                <div>
                  <p class="text-ink font-semibold">배달의민족</p>
                  <p class="text-ink text-lg font-bold">23,000원</p>
                </div>
              </div>
              <div class="text-ink-muted text-right text-xs">
                <p>금요일</p>
                <p>23:12</p>
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
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-ink text-sm font-semibold">이 소비 경험은 어땠나요?</span>
            <button
              type="button"
              class="text-ink-muted text-xs underline underline-offset-2"
            >
              건너뛰기
            </button>
          </div>
          <SatisfactionPicker v-model="satisfaction" />
        </div>

        <div class="divide-line border-line divide-y rounded-2xl border">
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-3.5"
            @click="purpose = nextOption(purposeOptions, purpose)"
          >
            <span class="text-ink flex items-center gap-2 text-sm font-medium">
              <IconTarget
                :size="16"
                class="text-verdict-adjust"
              />
              목적
            </span>
            <span class="text-ink-muted flex items-center gap-1 text-sm">
              {{ purpose }}
              <IconChevronRight :size="14" />
            </span>
          </button>
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-3.5"
            @click="companion = nextOption(companionOptions, companion)"
          >
            <span class="text-ink flex items-center gap-2 text-sm font-medium">
              <IconUsers
                :size="16"
                class="text-brand"
              />
              동행인
            </span>
            <span class="text-ink-muted flex items-center gap-1 text-sm">
              {{ companion }}
              <IconChevronRight :size="14" />
            </span>
          </button>
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-3.5"
            @click="repeatIntent = nextOption(repeatOptions, repeatIntent)"
          >
            <span class="text-ink flex items-center gap-2 text-sm font-medium">
              <IconRepeat
                :size="16"
                class="text-satisfaction-high"
              />
              반복 의향
            </span>
            <span class="text-ink-muted flex items-center gap-1 text-sm">
              {{ repeatIntent }}
              <IconChevronRight :size="14" />
            </span>
          </button>
        </div>
      </section>
    </main>

    <div class="px-5 pb-8">
      <PrimaryButton
        arrow
        :disabled="!canProceed"
        @click="next"
        >다음 단계로</PrimaryButton
      >
    </div>
  </div>
</template>
