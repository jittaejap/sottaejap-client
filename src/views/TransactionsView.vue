<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCircleCheck,
  IconCreditCard,
  IconMoodSad,
  IconMoodSmile,
  IconQuestionMark,
  IconSearch,
  IconUpload,
  IconX,
} from '@tabler/icons-vue'

import type { CardIssuer, Satisfaction } from '@/api/enums'
import AppBottomNav from '@/components/common/AppBottomNav.vue'
import AppTopBar from '@/components/common/AppTopBar.vue'
import MerchantBadge from '@/components/common/MerchantBadge.vue'
import PrimaryButton from '@/components/common/PrimaryButton.vue'

const tabs = ['거래내역', '추가 업로드', '회고 이력'] as const
const tab = ref<(typeof tabs)[number]>('거래내역')

const issuers: { value: CardIssuer; label: string }[] = [
  { value: 'KB', label: 'KB국민카드' },
  { value: 'HANA', label: '하나카드' },
  { value: 'SHINHAN', label: '신한카드' },
]
const issuerLabels: Record<CardIssuer, string> = {
  KB: 'KB국민카드',
  HANA: '하나카드',
  SHINHAN: '신한카드',
}

const transactions = [
  {
    merchant: '스타벅스 강남역점',
    amount: 5_200,
    category: '카페 · 간식',
    at: '2025.05.20 12:45',
    issuer: 'KB' as CardIssuer,
    retrospected: true,
  },
  {
    merchant: 'CU 역삼점',
    amount: 3_800,
    category: '편의점',
    at: '2025.05.20 09:18',
    issuer: 'KB' as CardIssuer,
    retrospected: true,
  },
  {
    merchant: 'SSG.COM',
    amount: 129_000,
    category: '쇼핑',
    at: '2025.05.19 22:11',
    issuer: 'SHINHAN' as CardIssuer,
    retrospected: false,
  },
  {
    merchant: '배달의민족',
    amount: 18_500,
    category: '식비 · 배달',
    at: '2025.05.19 19:36',
    issuer: 'HANA' as CardIssuer,
    retrospected: true,
  },
  {
    merchant: '이마트 역삼점',
    amount: 45_600,
    category: '마트 · 식료품',
    at: '2025.05.19 17:02',
    issuer: 'KB' as CardIssuer,
    retrospected: false,
  },
]

const search = ref('')
const scope = ref<'전체' | '회고함' | '미회고'>('전체')

const filteredTransactions = computed(() =>
  transactions.filter((t) => {
    const matchesText =
      search.value === '' || t.merchant.includes(search.value) || t.category.includes(search.value)
    const matchesScope =
      scope.value === '전체' || (scope.value === '회고함' ? t.retrospected : !t.retrospected)
    return matchesText && matchesScope
  }),
)

const selectedIssuer = ref<CardIssuer>('KB')
const uploadedFile = ref<{ name: string; size: string } | null>({
  name: '2025_05_KB카드_거래내역.xlsx',
  size: '2.4 MB',
})

const parseResult = [
  { label: '거래기간', value: '2025.05.01 ~ 2025.05.31' },
  { label: '카드사', value: 'KB국민카드' },
  { label: '총 거래건수', value: '1,236건' },
  { label: '총 사용금액', value: '2,845,320원' },
]

const satisfactionMeta: Record<
  Satisfaction,
  { label: string; icon: typeof IconMoodSmile; text: string; badge: string }
> = {
  HIGH: {
    label: '만족했어요',
    icon: IconMoodSmile,
    text: 'text-satisfaction-high',
    badge: 'text-satisfaction-high bg-satisfaction-high/10',
  },
  LOW: {
    label: '별로예요',
    icon: IconMoodSad,
    text: 'text-satisfaction-low',
    badge: 'text-satisfaction-low bg-satisfaction-low/10',
  },
  UNKNOWN: {
    label: '잘 모르겠어요',
    icon: IconQuestionMark,
    text: 'text-satisfaction-unknown',
    badge: 'text-satisfaction-unknown bg-satisfaction-unknown/10',
  },
}

const retrospectSummary = [
  { key: 'HIGH' as Satisfaction, count: 72 },
  { key: 'LOW' as Satisfaction, count: 24 },
  { key: 'UNKNOWN' as Satisfaction, count: 32 },
]

const retrospectHistory = [
  {
    date: '2025.05.20 (화)',
    items: [
      {
        merchant: '스타벅스 강남역점',
        amount: 5_200,
        category: '카페 · 간식',
        satisfaction: 'HIGH' as Satisfaction,
      },
      {
        merchant: 'CU 역삼점',
        amount: 3_800,
        category: '편의점',
        satisfaction: 'UNKNOWN' as Satisfaction,
      },
      {
        merchant: 'SSG.COM',
        amount: 129_000,
        category: '쇼핑',
        satisfaction: 'LOW' as Satisfaction,
      },
    ],
  },
  {
    date: '2025.05.19 (월)',
    items: [
      {
        merchant: '배달의민족',
        amount: 18_500,
        category: '식비 · 배달',
        satisfaction: 'HIGH' as Satisfaction,
      },
      {
        merchant: '이마트 역삼점',
        amount: 45_600,
        category: '마트 · 식료품',
        satisfaction: 'UNKNOWN' as Satisfaction,
      },
      {
        merchant: '올리브영 강남점',
        amount: 27_000,
        category: '뷰티 · 헬스',
        satisfaction: 'LOW' as Satisfaction,
      },
    ],
  },
]
</script>

<template>
  <div class="flex h-full flex-col">
    <AppTopBar
      title="거래내역"
      bell
      bell-dot
    />

    <div class="border-line flex shrink-0 border-b">
      <button
        v-for="t in tabs"
        :key="t"
        type="button"
        class="flex-1 border-b-2 py-3 text-sm font-semibold"
        :class="tab === t ? 'border-brand text-brand' : 'border-transparent text-ink-muted'"
        @click="tab = t"
      >
        {{ t }}
      </button>
    </div>

    <main class="flex-1 space-y-4 overflow-y-auto px-4 py-4">
      <template v-if="tab === '거래내역'">
        <div class="border-line flex items-center gap-2 rounded-2xl border px-4 py-3">
          <IconSearch
            :size="18"
            class="text-ink-muted"
          />
          <input
            v-model="search"
            type="text"
            placeholder="가맹점, 메모 검색"
            class="text-ink placeholder:text-ink-faint flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        <div class="flex gap-2">
          <button
            v-for="label in ['기간', '카드사', '카테고리', '정렬']"
            :key="label"
            type="button"
            class="border-line text-ink-muted flex flex-1 items-center justify-center gap-0.5 rounded-xl border py-2 text-xs font-medium"
          >
            {{ label }} <IconChevronDown :size="13" />
          </button>
        </div>

        <div class="flex gap-2">
          <button
            v-for="s in ['전체', '회고함', '미회고'] as const"
            :key="s"
            type="button"
            class="flex-1 rounded-xl border py-2 text-sm font-medium"
            :class="
              scope === s ? 'border-brand bg-brand/5 text-brand' : 'border-line text-ink-muted'
            "
            @click="scope = s"
          >
            {{ s }}
          </button>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-ink-muted text-xs">
            총 {{ filteredTransactions.length.toLocaleString('ko-KR') }}건
          </p>
          <button
            type="button"
            class="text-ink-muted flex items-center gap-0.5 text-xs"
          >
            최근 거래일 순 <IconChevronDown :size="13" />
          </button>
        </div>

        <div class="divide-line border-line divide-y rounded-2xl border">
          <button
            v-for="t in filteredTransactions"
            :key="t.merchant + t.at"
            type="button"
            class="flex w-full items-center gap-3 px-3 py-3"
          >
            <MerchantBadge :name="t.merchant" />
            <span class="min-w-0 flex-1 text-left">
              <span class="text-ink block truncate text-sm font-semibold">{{ t.merchant }}</span>
              <span class="text-ink-muted block text-xs">{{ t.category }}</span>
              <span class="text-ink-muted block text-[11px]"
                >{{ t.at }} · {{ issuerLabels[t.issuer] }}</span
              >
            </span>
            <span class="shrink-0 text-right">
              <span class="text-ink block text-sm font-bold"
                >{{ t.amount.toLocaleString('ko-KR') }}원</span
              >
              <span
                class="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                :class="
                  t.retrospected
                    ? 'text-satisfaction-high bg-satisfaction-high/10'
                    : 'text-satisfaction-low bg-satisfaction-low/10'
                "
              >
                {{ t.retrospected ? '회고함' : '미회고' }}
              </span>
            </span>
            <IconChevronRight
              :size="16"
              class="text-ink-muted shrink-0"
            />
          </button>
        </div>
      </template>

      <template v-else-if="tab === '추가 업로드'">
        <div class="space-y-2">
          <p class="text-ink text-sm font-semibold">1. 카드사 선택</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="issuer in issuers"
              :key="issuer.value"
              type="button"
              class="relative flex flex-col items-center gap-2 rounded-2xl border py-4"
              :class="selectedIssuer === issuer.value ? 'border-brand' : 'border-line'"
              @click="selectedIssuer = issuer.value"
            >
              <span
                v-if="selectedIssuer === issuer.value"
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
              <span class="text-ink text-xs font-semibold">{{ issuer.label }}</span>
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-ink text-sm font-semibold">2. 파일 업로드</p>
          <div class="border-line rounded-2xl border border-dashed px-4 py-8 text-center">
            <IconUpload
              :size="28"
              class="text-brand mx-auto"
              :stroke-width="1.5"
            />
            <p class="text-ink-muted mt-3 text-sm">거래내역 파일을 드래그하거나</p>
            <p class="text-ink text-sm font-semibold">파일을 선택하세요.</p>
            <p class="text-ink-muted mt-1 text-xs">CSV, XLSX, PDF 파일 지원</p>
            <button
              type="button"
              class="border-line text-ink mt-3 rounded-full border px-4 py-1.5 text-sm font-medium"
              @click="uploadedFile = { name: '2025_05_KB카드_거래내역.xlsx', size: '2.4 MB' }"
            >
              파일 선택
            </button>
          </div>
          <div
            v-if="uploadedFile"
            class="border-line flex items-center gap-3 rounded-2xl border p-3"
          >
            <span
              class="bg-surface-muted flex size-10 shrink-0 items-center justify-center rounded-xl"
            >
              <IconUpload
                :size="18"
                class="text-ink-muted"
              />
            </span>
            <span class="min-w-0 flex-1">
              <span class="text-ink block truncate text-sm font-medium">{{
                uploadedFile.name
              }}</span>
              <span class="text-ink-muted block text-xs">{{ uploadedFile.size }}</span>
            </span>
            <button
              type="button"
              class="text-ink-muted shrink-0"
              aria-label="파일 제거"
              @click="uploadedFile = null"
            >
              <IconX :size="18" />
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-ink text-sm font-semibold">3. 파싱 결과 확인</p>
            <span
              class="text-satisfaction-high bg-satisfaction-high/10 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
            >
              <IconCircleCheck :size="14" /> 정상 처리
            </span>
          </div>
          <div class="bg-surface-muted rounded-2xl p-4">
            <p class="text-ink font-bold">총 1,236건의 거래내역을 불러왔어요.</p>
            <p class="text-ink-muted mt-1 text-xs">아래 내용을 확인하고 업로드를 완료해주세요.</p>
            <dl class="divide-line border-line mt-3 divide-y rounded-xl border">
              <div
                v-for="row in parseResult"
                :key="row.label"
                class="flex items-center justify-between px-3 py-2.5"
              >
                <dt class="text-ink-muted text-xs">{{ row.label }}</dt>
                <dd class="text-ink text-xs font-semibold">{{ row.value }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <PrimaryButton :disabled="uploadedFile === null">업로드 완료</PrimaryButton>
      </template>

      <template v-else>
        <div
          class="divide-line border-line grid grid-cols-4 divide-x rounded-2xl border py-3 text-center"
        >
          <div>
            <p class="text-ink-muted text-[11px]">총 회고 수</p>
            <p class="text-ink mt-1 text-base font-extrabold">128건</p>
          </div>
          <div
            v-for="s in retrospectSummary"
            :key="s.key"
          >
            <p class="text-ink-muted text-[11px]">{{ satisfactionMeta[s.key].label }}</p>
            <p
              class="mt-1 text-base font-extrabold"
              :class="satisfactionMeta[s.key].text"
            >
              {{ s.count }}
            </p>
          </div>
        </div>

        <div
          v-for="group in retrospectHistory"
          :key="group.date"
          class="space-y-2"
        >
          <div class="flex items-center justify-between">
            <p class="text-ink-muted text-xs font-medium">{{ group.date }}</p>
            <span class="bg-surface-muted text-ink-muted rounded-full px-2 py-0.5 text-[11px]"
              >{{ group.items.length }}건</span
            >
          </div>
          <div class="divide-line border-line divide-y rounded-2xl border">
            <button
              v-for="item in group.items"
              :key="item.merchant"
              type="button"
              class="flex w-full items-center gap-3 px-3 py-3"
            >
              <MerchantBadge :name="item.merchant" />
              <span class="min-w-0 flex-1 text-left">
                <span class="text-ink block truncate text-sm font-semibold">{{
                  item.merchant
                }}</span>
                <span class="text-ink-muted block text-xs">{{ item.category }}</span>
              </span>
              <span class="shrink-0 text-right">
                <span class="text-ink block text-sm font-bold"
                  >{{ item.amount.toLocaleString('ko-KR') }}원</span
                >
                <span
                  class="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  :class="satisfactionMeta[item.satisfaction].badge"
                >
                  <component
                    :is="satisfactionMeta[item.satisfaction].icon"
                    :size="12"
                  />
                  {{ satisfactionMeta[item.satisfaction].label }}
                </span>
              </span>
              <IconChevronRight
                :size="16"
                class="text-ink-muted shrink-0"
              />
            </button>
          </div>
        </div>
      </template>
    </main>

    <AppBottomNav />
  </div>
</template>
