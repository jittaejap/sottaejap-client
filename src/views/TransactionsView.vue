<script setup lang="ts">
import { computed, inject, ref, useTemplateRef, watch } from 'vue'
import { routeLocationKey } from 'vue-router'
import {
  IconChevronRight,
  IconCircleCheck,
  IconMoodSad,
  IconMoodSmile,
  IconQuestionMark,
  IconUpload,
  IconX,
} from '@tabler/icons-vue'

import type { Satisfaction } from '@/api/enums'
import AppBottomNav from '@/components/common/AppBottomNav.vue'
import AppFilterDropdown from '@/components/common/AppFilterDropdown.vue'
import AppTopBar from '@/components/common/AppTopBar.vue'
import MerchantBadge from '@/components/common/MerchantBadge.vue'
import PrimaryButton from '@/components/common/PrimaryButton.vue'
import { apiErrorMessage } from '@/api/errorMessage'
import { getTransactions, uploadTransactions } from '@/api/service'
import type { Transaction, TransactionPage, TransactionUploadResult } from '@/api/types'

const route = inject(routeLocationKey, null)
const tabs = ['거래내역', '추가 업로드', '회고 이력'] as const
const tab = ref<(typeof tabs)[number]>('거래내역')

const routeCategory = typeof route?.query.category === 'string' ? route.query.category : ''
const category = ref(routeCategory)
const period = ref('ALL')
const retrospect = ref('ALL')
const page = ref(0)
const transactionsPage = ref<TransactionPage>({
  transactions: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
})
const loading = ref(false)
const loadError = ref('')

const periodOptions = [
  { value: 'ALL', label: '기간' },
  { value: '3D', label: '3일' },
  { value: '7D', label: '7일' },
  { value: '1M', label: '1개월' },
  { value: '3M', label: '3개월' },
] as const
const retrospectOptions = [
  { value: 'ALL', label: '회고' },
  { value: 'DONE', label: '회고함' },
  { value: 'TODO', label: '미회고' },
] as const
const allFiltersCleared = computed(
  () => period.value === 'ALL' && category.value === '' && retrospect.value === 'ALL',
)

function clearFilters() {
  period.value = 'ALL'
  category.value = ''
  retrospect.value = 'ALL'
  page.value = 0
}

function dateInKst(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date)
}

function queryPeriod() {
  if (period.value === 'ALL') return {}
  const days =
    ({ '3D': 3, '7D': 7, '1M': 30, '3M': 90 } as Record<string, number>)[period.value] ?? 0
  const today = new Date()
  const from = new Date(today)
  from.setDate(today.getDate() - (days - 1))
  return { from: dateInKst(from), to: dateInKst(today) }
}

async function loadTransactions() {
  loading.value = true
  loadError.value = ''
  try {
    const result = await getTransactions({
      ...queryPeriod(),
      ...(category.value ? { category: category.value } : {}),
      ...(tab.value === '회고 이력'
        ? { hasRetrospect: true }
        : retrospect.value === 'DONE'
          ? { hasRetrospect: true }
          : retrospect.value === 'TODO'
            ? { hasRetrospect: false }
            : {}),
      page: page.value,
      size: 20,
    })
    transactionsPage.value = result
    if (result.totalPages > 0 && page.value >= result.totalPages) page.value = result.totalPages - 1
  } catch (error) {
    loadError.value = apiErrorMessage(error, '거래내역을 불러오지 못했어요. 다시 시도해주세요.')
    transactionsPage.value = {
      transactions: [],
      page: page.value,
      size: 20,
      totalElements: 0,
      totalPages: 0,
    }
  } finally {
    loading.value = false
  }
}

watch(
  [period, category, retrospect, tab],
  () => {
    page.value = 0
    void loadTransactions()
  },
  { immediate: true },
)
watch(page, () => {
  void loadTransactions()
})

const transactions = computed(() => transactionsPage.value.transactions)
const totalPages = computed(() => transactionsPage.value.totalPages)
const retrospectSummary = computed(() => transactionsPage.value.totalElements)
const retrospectHistory = computed(() => {
  const groups = new Map<string, Transaction[]>()
  for (const item of transactions.value) {
    if (item.retrospectId === null) continue
    const date = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      dateStyle: 'medium',
      weekday: 'short',
    }).format(new Date(item.occurredAt))
    groups.set(date, [...(groups.get(date) ?? []), item])
  }
  return [...groups].map(([date, items]) => ({ date, items }))
})

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const uploadedFile = ref<{ name: string; size: string } | null>(null)
const selectedFile = ref<File | null>(null)
const fileError = ref('')
const uploadResult = ref<TransactionUploadResult | null>(null)
const uploading = ref(false)

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function attachFile(file?: File) {
  if (!file) return

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension !== 'csv' && extension !== 'xlsx') {
    fileError.value = 'CSV 또는 XLSX 파일만 선택할 수 있어요.'
    return
  }

  uploadedFile.value = { name: file.name, size: formatFileSize(file.size) }
  selectedFile.value = file
  uploadResult.value = null
  fileError.value = ''
}

function onFileChange(event: Event) {
  attachFile((event.target as HTMLInputElement).files?.[0])
}

function onFileDrop(event: DragEvent) {
  attachFile(event.dataTransfer?.files[0])
}

function removeFile() {
  uploadedFile.value = null
  selectedFile.value = null
  uploadResult.value = null
  fileError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

const parseResult = computed(() => {
  if (!uploadResult.value) return []
  return [
    {
      label: '거래기간',
      value: `${uploadResult.value.periodFrom} ~ ${uploadResult.value.periodTo}`,
    },
    { label: '정상 처리', value: `${uploadResult.value.importedCount.toLocaleString('ko-KR')}건` },
    { label: '건너뜀', value: `${uploadResult.value.skippedCount.toLocaleString('ko-KR')}건` },
  ]
})

async function submitUpload() {
  if (!selectedFile.value || uploading.value) return
  uploading.value = true
  fileError.value = ''
  try {
    uploadResult.value = await uploadTransactions(selectedFile.value)
  } catch (error) {
    fileError.value = apiErrorMessage(
      error,
      '거래내역을 업로드하지 못했어요. 파일을 확인하고 다시 시도해주세요.',
    )
  } finally {
    uploading.value = false
  }
}

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

    <main class="flex-1 overflow-y-auto px-4 py-4">
      <Transition
        name="subview"
        mode="out-in"
      >
        <div
          :key="tab"
          class="space-y-4"
        >
          <template v-if="tab === '거래내역'">
            <div class="flex gap-1">
              <button
                type="button"
                class="border-line h-9 shrink-0 rounded-xl border px-3 text-xs font-medium"
                :class="
                  allFiltersCleared
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'bg-surface text-ink-muted'
                "
                @click="clearFilters"
              >
                전체
              </button>
              <AppFilterDropdown
                v-model="period"
                label="기간 필터"
                :options="periodOptions"
                :active="period !== 'ALL'"
              />
              <AppFilterDropdown
                v-model="retrospect"
                label="회고 필터"
                :options="retrospectOptions"
                :active="retrospect !== 'ALL'"
              />
            </div>

            <p class="text-ink-muted text-xs">
              총 {{ transactionsPage.totalElements.toLocaleString('ko-KR') }}건
            </p>

            <p
              v-if="loading"
              class="text-ink-muted py-8 text-center text-sm"
            >
              거래내역을 불러오는 중...
            </p>
            <p
              v-else-if="loadError"
              class="text-brand py-8 text-center text-sm"
            >
              {{ loadError }}
            </p>
            <p
              v-else-if="transactions.length === 0"
              class="text-ink-muted py-8 text-center text-sm"
            >
              거래내역이 없어요.
            </p>

            <div class="divide-line border-line divide-y rounded-2xl border">
              <button
                v-for="t in transactions"
                :key="t.id"
                type="button"
                class="flex w-full items-center gap-3 px-3 py-3"
              >
                <MerchantBadge :name="t.merchant" />
                <span class="min-w-0 flex-1 text-left">
                  <span class="text-ink block truncate text-sm font-semibold">{{
                    t.merchant
                  }}</span>
                  <span class="text-ink-muted block text-xs">{{ t.category }}</span>
                  <span class="text-ink-muted block text-[11px]">{{
                    new Date(t.occurredAt).toLocaleString('ko-KR')
                  }}</span>
                </span>
                <span class="shrink-0 text-right">
                  <span class="text-ink block text-sm font-bold"
                    >{{ t.amount.toLocaleString('ko-KR') }}원</span
                  >
                  <span
                    class="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    :class="
                      t.retrospectId !== null
                        ? 'text-satisfaction-high bg-satisfaction-high/10'
                        : 'text-satisfaction-low bg-satisfaction-low/10'
                    "
                  >
                    {{ t.retrospectId !== null ? '회고함' : '미회고' }}
                  </span>
                </span>
                <IconChevronRight
                  :size="16"
                  class="text-ink-muted shrink-0"
                />
              </button>
            </div>
            <div
              v-if="totalPages > 1"
              class="flex items-center justify-center gap-4 py-2"
            >
              <button
                type="button"
                class="text-ink-muted text-sm"
                :disabled="page === 0"
                @click="page--"
              >
                이전
              </button>
              <span class="text-ink text-sm">{{ page + 1 }} / {{ totalPages }}</span>
              <button
                type="button"
                class="text-ink-muted text-sm"
                :disabled="page + 1 >= totalPages"
                @click="page++"
              >
                다음
              </button>
            </div>
          </template>

          <template v-else-if="tab === '추가 업로드'">
            <div class="space-y-2">
              <p class="text-ink text-sm font-semibold">1. 파일 업로드</p>
              <div
                class="border-line rounded-2xl border border-dashed px-4 py-8 text-center"
                @dragover.prevent
                @drop.prevent="onFileDrop"
              >
                <IconUpload
                  :size="28"
                  class="text-brand mx-auto"
                  :stroke-width="1.5"
                />
                <p class="text-ink-muted mt-3 text-sm">거래내역 파일을 드래그하거나</p>
                <p class="text-ink text-sm font-semibold">파일을 선택하세요.</p>
                <p class="text-ink-muted mt-1 text-xs">CSV, XLSX 파일 지원</p>
                <input
                  ref="fileInput"
                  type="file"
                  accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  class="hidden"
                  @change="onFileChange"
                />
                <button
                  type="button"
                  class="border-line text-ink mt-3 rounded-full border px-4 py-1.5 text-sm font-medium"
                  @click="fileInput?.click()"
                >
                  파일 선택
                </button>
              </div>
              <p
                v-if="fileError"
                class="text-brand px-1 text-xs"
              >
                {{ fileError }}
              </p>
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
                  @click="removeFile"
                >
                  <IconX :size="18" />
                </button>
              </div>
            </div>

            <div
              v-if="uploadResult"
              class="space-y-2"
            >
              <div class="flex items-center justify-between">
                <p class="text-ink text-sm font-semibold">2. 파싱 결과 확인</p>
                <span
                  class="text-satisfaction-high bg-satisfaction-high/10 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                >
                  <IconCircleCheck :size="14" /> 정상 처리
                </span>
              </div>
              <div class="bg-surface-muted rounded-2xl p-4">
                <p class="text-ink font-bold">
                  총 {{ uploadResult.importedCount.toLocaleString('ko-KR') }}건의 거래내역을
                  불러왔어요.
                </p>
                <p class="text-ink-muted mt-1 text-xs">
                  아래 내용을 확인하고 업로드를 완료해주세요.
                </p>
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
                <ul
                  v-if="uploadResult.skippedRows.length"
                  class="text-ink-muted mt-3 space-y-1 text-xs"
                >
                  <li
                    v-for="row in uploadResult.skippedRows"
                    :key="row.row"
                  >
                    {{ row.row }}행: {{ row.reason }}
                  </li>
                </ul>
              </div>
            </div>
            <PrimaryButton
              :disabled="selectedFile === null || uploading || uploadResult !== null"
              @click="submitUpload"
              >{{
                uploadResult ? '업로드 완료됨' : uploading ? '업로드 중...' : '업로드 완료'
              }}</PrimaryButton
            >
          </template>

          <template v-else>
            <div
              class="divide-line border-line grid grid-cols-2 divide-x rounded-2xl border py-3 text-center"
            >
              <div>
                <p class="text-ink-muted text-[11px]">총 회고 수</p>
                <p class="text-ink mt-1 text-base font-extrabold">128건</p>
              </div>
              <div class="col-span-3">
                <p class="text-ink-muted text-[11px]">총 회고 수</p>
                <p class="text-ink mt-1 text-base font-extrabold">{{ retrospectSummary }}건</p>
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
                  :key="item.id"
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
                      :class="
                        item.satisfaction
                          ? satisfactionMeta[item.satisfaction].badge
                          : 'text-ink-muted bg-surface-muted'
                      "
                    >
                      <component
                        :is="
                          item.satisfaction
                            ? satisfactionMeta[item.satisfaction].icon
                            : IconQuestionMark
                        "
                        :size="12"
                      />
                      {{ item.satisfaction ? satisfactionMeta[item.satisfaction].label : '미입력' }}
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
        </div>
      </Transition>
    </main>

    <AppBottomNav />
  </div>
</template>
