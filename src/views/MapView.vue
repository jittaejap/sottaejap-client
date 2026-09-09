<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IconBulb,
  IconCircleX,
  IconCrown,
  IconChevronDown,
  IconMessage2,
  IconMoodNeutral,
  IconMoodSmile,
  IconMoonStars,
  IconPencil,
  IconReceipt2,
  IconStar,
  IconThumbUp,
} from '@tabler/icons-vue'

import type { BehaviorTransaction, SatisfactionMap, SatisfactionMapPoint } from '@/api/types'
import AppBottomNav from '@/components/common/AppBottomNav.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppTopBar from '@/components/common/AppTopBar.vue'
import MerchantBadge from '@/components/common/MerchantBadge.vue'
import PrimaryButton from '@/components/common/PrimaryButton.vue'
import SatisfactionScatter from '@/components/map/SatisfactionScatter.vue'
import {
  PRESCRIPTION_LABEL,
  QUADRANT_DOT_CLASS,
  VERDICT_BADGE,
  VERDICT_SOFT_BG_CLASS,
  VERDICT_TEXT_CLASS,
  quadrantTone,
  verdictTone,
} from '@/components/map/verdictStyle'
import { useMapStore } from '@/stores/map'
import { apiErrorMessage } from '@/api/errorMessage'
import { getBehavior, getSatisfactionMap } from '@/api/service'

const route = useRoute()
const router = useRouter()
const mapStore = useMapStore()
const subview = ref<'map' | 'behavior' | 'transactions'>('map')

const selectedId = ref<number | null>(null)
const filter = ref<string>('전체')
const loading = ref(true)
const loadError = ref('')
const fallbackSelected = ref<SatisfactionMapPoint | null>(null)

async function loadMap() {
  loading.value = true
  loadError.value = ''
  try {
    mapStore.data = await getSatisfactionMap()
  } catch (error) {
    mapStore.data = null
    loadError.value = apiErrorMessage(error, '만족도 지도를 불러오지 못했어요. 다시 시도해주세요.')
    const behaviorId = Number(route.params.behaviorId)
    if (Number.isInteger(behaviorId)) {
      selectedId.value = behaviorId
      subview.value = 'behavior'
    }
    loading.value = false
    return
  }
  const behaviorId = Number(route.params.behaviorId)
  if (Number.isInteger(behaviorId)) {
    selectedId.value = behaviorId
    subview.value = 'behavior'
  } else {
    selectedId.value ??= mapStore.sortedPoints[0]?.behaviorId ?? null
  }
  loading.value = false
}

onMounted(loadMap)

const points = computed(() => mapStore.sortedPoints)
const visiblePoints = computed(() =>
  filter.value === '전체' ? points.value : points.value.filter((p) => p.name === filter.value),
)
const selected = computed<SatisfactionMapPoint | null>(
  () =>
    points.value.find((p) => p.behaviorId === selectedId.value) ??
    (fallbackSelected.value?.behaviorId === selectedId.value ? fallbackSelected.value : null),
)

/** -1~+1 축을 회고 화면과 같은 5점 척도로 환산한다. */
const satisfactionScore = computed(() =>
  selected.value ? ((selected.value.adjustedSatisfaction + 1) / 2) * 4 + 1 : 0,
)

const selectedTone = computed(() => (selected.value ? verdictTone(selected.value) : 'pending'))
const selectedQuadrantTone = computed(() =>
  selected.value ? quadrantTone(selected.value) : 'pending',
)

/** 조회에 성공했을 때만 경계선을 그린다 — 07 §8 · E-74. */
const boundaries = computed<SatisfactionMap['boundaries']>(
  () => mapStore.data?.boundaries ?? { x: null, y: null },
)

const burdenLabel = computed(() => {
  const boundary = mapStore.data?.boundaries.x ?? null
  if (selected.value === null || boundary === null) return '보통'
  return selected.value.burdenRatio >= boundary ? '높음' : '낮음'
})

/** 선택한 점의 거래는 05 §2 `GET /behaviors/{id}`가 준다 — 이 묶음과 자식 리프의 합집합(E-72). */
const behaviorTransactions = ref<BehaviorTransaction[]>([])
const transactionsLoading = ref(false)
const transactionsError = ref('')

/**
 * 요청 세대. 선택한 점이 같아도(B → A → B) 먼저 나간 요청과 마지막 요청을 구분해야 하므로
 * `selectedId`가 아니라 이 번호로 최신 요청을 가린다. 화면에 그리지 않으니 ref로 두지 않는다.
 */
let transactionsRequestId = 0

async function loadTransactions(behaviorId: number | null) {
  const requestId = ++transactionsRequestId
  behaviorTransactions.value = []
  transactionsError.value = ''
  transactionsLoading.value = behaviorId !== null
  if (behaviorId === null) return
  const isFallback = !mapStore.data?.points.some((point) => point.behaviorId === behaviorId)
  try {
    const detail = await getBehavior(behaviorId)
    if (requestId !== transactionsRequestId) return
    behaviorTransactions.value = detail.transactions
    if (isFallback) {
      // GET /behaviors/{id} 계약에는 지도 전용 prescription·cta가 없으므로 폴백 상세에서는 숨긴다.
      fallbackSelected.value = {
        ...detail.behavior,
        prescription: '',
        cta: null,
      }
    }
  } catch (error) {
    if (requestId !== transactionsRequestId) return
    transactionsError.value = apiErrorMessage(
      error,
      isFallback
        ? '행동 상세를 불러오지 못했어요. 다시 시도해주세요.'
        : '거래 내역을 불러오지 못했어요. 다시 시도해주세요.',
    )
  }
  transactionsLoading.value = false
}

watch(selectedId, loadTransactions)

watch(
  () => [route.name, route.params.behaviorId] as const,
  ([routeName, value]) => {
    if (routeName === 'map') {
      subview.value = 'map'
      fallbackSelected.value = null
      selectedId.value = mapStore.sortedPoints[0]?.behaviorId ?? null
      return
    }
    const behaviorId = Number(value)
    if (!Number.isInteger(behaviorId)) return
    fallbackSelected.value = null
    selectedId.value = behaviorId
    subview.value = 'behavior'
  },
)

const transactions = computed(() =>
  behaviorTransactions.value.map((transaction) => ({
    id: transaction.id,
    merchant: transaction.merchant,
    amount: transaction.amount,
    category: transaction.category,
    at: new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(transaction.occurredAt),
    ),
  })),
)

const transactionsTotal = computed(() =>
  transactions.value.reduce((sum, transaction) => sum + transaction.amount, 0),
)

function selectPoint(behaviorId: number) {
  selectedId.value = behaviorId
}

function openBehavior(behaviorId: number) {
  selectedId.value = behaviorId
  subview.value = 'behavior'
}

function handleBack() {
  if (subview.value === 'transactions') {
    subview.value = 'behavior'
    return
  }
  if (subview.value === 'behavior' && route.name === 'behavior-detail') {
    void router.replace({ name: 'map' })
    return
  }
  subview.value = 'map'
}
</script>

<template>
  <div class="flex h-full flex-col">
    <AppTopBar
      v-if="subview === 'map'"
      title="나의 만족도 지도"
      bell
    />
    <AppTopBar
      v-else
      :back-handler="handleBack"
    />

    <main class="flex-1 overflow-y-auto px-4 pb-6">
      <Transition
        name="subview"
        mode="out-in"
      >
        <div
          :key="subview"
          class="space-y-4"
        >
          <template v-if="subview === 'map'">
            <p class="text-ink text-lg font-bold">만족도와 지출 부담을 함께 확인해보세요</p>
            <p
              v-if="loading"
              class="text-ink-muted py-10 text-center text-sm"
            >
              만족도 지도를 불러오는 중이에요.
            </p>

            <div
              v-else-if="loadError"
              class="border-line space-y-3 rounded-2xl border p-4 text-center"
            >
              <p class="text-ink-muted text-sm">{{ loadError }}</p>
              <PrimaryButton
                variant="outline"
                @click="loadMap"
                >다시 시도</PrimaryButton
              >
            </div>

            <p
              v-else-if="points.length === 0"
              class="text-ink-muted border-line rounded-2xl border p-6 text-center text-sm leading-relaxed"
            >
              아직 지도에 그릴 회고가 없어요.<br />
              채팅에서 회고를 남기면 소비 행동이 이 지도에 나타나요.
            </p>

            <div
              v-else
              class="border-line rounded-2xl border p-3"
            >
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-full border px-3 py-1.5 text-xs font-medium"
                  :class="
                    filter === '전체'
                      ? 'border-brand bg-brand text-surface'
                      : 'border-line text-ink-muted'
                  "
                  @click="filter = '전체'"
                >
                  전체
                </button>
                <button
                  v-for="p in points"
                  :key="p.behaviorId"
                  type="button"
                  class="rounded-full border px-3 py-1.5 text-xs font-medium"
                  :class="
                    filter === p.name ? 'border-brand text-brand' : 'border-line text-ink-muted'
                  "
                  @click="((filter = p.name), selectPoint(p.behaviorId))"
                >
                  {{ p.name }}
                </button>
              </div>

              <div class="border-line relative mt-4 border-t pt-4">
                <div
                  class="pointer-events-none absolute top-5 right-6 left-9 z-10 flex justify-between text-xs font-bold"
                >
                  <span class="text-map-awesome flex items-center gap-1">
                    <IconCrown
                      :size="17"
                      :stroke-width="2.5"
                    />
                    {{ PRESCRIPTION_LABEL.PROTECT }}
                  </span>
                  <span class="text-map-great flex items-center gap-1">
                    <IconThumbUp
                      :size="17"
                      :stroke-width="2.5"
                    />
                    {{ PRESCRIPTION_LABEL.KEEP }}
                  </span>
                </div>
                <div
                  class="pointer-events-none absolute right-6 bottom-11 left-9 z-10 flex justify-between text-xs font-bold"
                >
                  <span class="text-map-umm flex items-center gap-1">
                    <IconMoodNeutral
                      :size="17"
                      :stroke-width="2.5"
                    />
                    {{ PRESCRIPTION_LABEL.MINOR }}
                  </span>
                  <span class="text-map-hmm flex items-center gap-1">
                    <IconCircleX
                      :size="17"
                      :stroke-width="2.5"
                    />
                    {{ PRESCRIPTION_LABEL.PRIORITY }}
                  </span>
                </div>

                <div class="flex">
                  <div
                    class="text-ink-muted flex w-4 shrink-0 flex-col items-center justify-between py-2 text-[11px]"
                  >
                    <span>높음</span>
                    <span class="[writing-mode:vertical-rl] font-medium">{{
                      mapStore.data?.axisY.label
                    }}</span>
                    <span>낮음</span>
                  </div>
                  <SatisfactionScatter
                    class="min-w-0 flex-1"
                    :points="visiblePoints"
                    :boundaries="boundaries"
                    :selected-id="selectedId"
                    @select="openBehavior"
                  />
                </div>

                <div class="text-ink-muted mt-1 flex items-center justify-between pl-4 text-[11px]">
                  <span>낮음</span>
                  <span class="font-medium">{{ mapStore.data?.axisX.label }}</span>
                  <span>높음</span>
                </div>
              </div>
            </div>

            <AppCard v-if="selected">
              <div class="flex items-center gap-2">
                <span
                  class="size-3 shrink-0 rounded-full"
                  :class="QUADRANT_DOT_CLASS[selectedQuadrantTone]"
                ></span>
                <p class="text-ink font-bold">
                  {{ selected.name }}({{ selected.retrospectCount }})
                </p>
                <span
                  v-if="VERDICT_BADGE[selectedTone]"
                  class="rounded-full px-2 py-0.5 text-xs font-semibold"
                  :class="[VERDICT_TEXT_CLASS[selectedTone], VERDICT_SOFT_BG_CLASS[selectedTone]]"
                >
                  {{ VERDICT_BADGE[selectedTone] }}
                </span>
              </div>

              <div
                class="divide-line border-line mt-3 grid grid-cols-3 divide-x rounded-xl border py-2 text-center"
              >
                <div>
                  <p class="text-ink-muted text-[11px]">평균 결제금액</p>
                  <p class="text-ink mt-0.5 text-sm font-bold">
                    {{ selected.avgAmount.toLocaleString('ko-KR') }}원
                  </p>
                </div>
                <div>
                  <p class="text-ink-muted text-[11px]">최근 건수</p>
                  <p class="text-ink mt-0.5 text-sm font-bold">{{ selected.txCount }}건</p>
                </div>
                <div>
                  <p class="text-ink-muted text-[11px]">상태</p>
                  <p class="text-ink mt-0.5 text-sm font-bold">
                    {{ selected.evaluationStatus === 'PENDING' ? '보류' : '완료' }}
                  </p>
                </div>
              </div>

              <p class="text-ink-muted mt-3 flex gap-1.5 text-xs leading-relaxed">
                <IconBulb
                  :size="15"
                  class="text-brand mt-0.5 shrink-0"
                />
                {{ selected.prescription }}
              </p>

              <p
                v-if="transactionsError"
                class="text-ink-muted mt-2 text-xs"
              >
                {{ transactionsError }}
              </p>
              <div
                v-else
                class="divide-line mt-2 divide-y"
              >
                <div
                  v-for="tx in transactions.slice(0, 3)"
                  :key="tx.id"
                  class="flex items-center gap-3 py-2.5"
                >
                  <MerchantBadge
                    :name="tx.merchant"
                    size="sm"
                  />
                  <span class="flex-1">
                    <span class="text-ink block text-sm font-semibold">{{ tx.merchant }}</span>
                    <span class="text-ink-muted block text-xs">{{ tx.at }}</span>
                  </span>
                  <span class="text-ink text-sm font-bold"
                    >{{ tx.amount.toLocaleString('ko-KR') }}원</span
                  >
                </div>
              </div>

              <RouterLink
                :to="{
                  name: 'behavior-reviews',
                  params: { behaviorId: selected.behaviorId },
                }"
                class="text-ink-muted mt-2 flex w-full items-center justify-center gap-1 text-xs"
              >
                더 보기 <IconChevronDown :size="14" />
              </RouterLink>
            </AppCard>
          </template>

          <template v-else-if="subview === 'behavior' && selected">
            <div class="flex items-center gap-3">
              <span
                class="flex size-14 shrink-0 items-center justify-center rounded-full"
                :class="VERDICT_SOFT_BG_CLASS[selectedTone]"
              >
                <IconMoonStars
                  :size="26"
                  :stroke-width="1.5"
                  :class="VERDICT_TEXT_CLASS[selectedTone]"
                />
              </span>
              <div>
                <p class="text-ink text-lg font-bold">{{ selected.name }}</p>
                <p class="text-ink-muted text-sm">최근 30일 기준 소비 행동이에요</p>
              </div>
            </div>

            <div class="flex gap-2">
              <span
                class="bg-surface-muted text-ink-muted rounded-full px-3 py-1 text-xs font-medium"
              >
                만족도 {{ selected.adjustedSatisfaction >= 0 ? '높음' : '낮음' }}
              </span>
              <span
                class="bg-surface-muted text-ink-muted rounded-full px-3 py-1 text-xs font-medium"
              >
                지출 부담 {{ burdenLabel }}
              </span>
            </div>

            <div>
              <p class="text-ink mb-2 text-sm font-semibold">핵심 지표</p>
              <div class="grid grid-cols-2 gap-3">
                <AppCard>
                  <p class="text-ink-muted flex items-center gap-1 text-xs">
                    <IconReceipt2 :size="14" /> 총 지출 금액
                  </p>
                  <p class="text-ink mt-1 text-xl font-extrabold">
                    {{ selected.monthlyTotalAmount.toLocaleString('ko-KR') }}원
                  </p>
                  <p class="text-ink-muted text-[11px]">최근 30일</p>
                </AppCard>
                <AppCard>
                  <p class="text-ink-muted flex items-center gap-1 text-xs">
                    <IconPencil :size="14" /> 이용 횟수
                  </p>
                  <p class="text-ink mt-1 text-xl font-extrabold">{{ selected.txCount }}회</p>
                  <p class="text-ink-muted text-[11px]">최근 30일</p>
                </AppCard>
                <AppCard>
                  <p class="text-ink-muted flex items-center gap-1 text-xs">
                    <IconStar :size="14" /> 평균 만족도
                  </p>
                  <p class="text-ink mt-1 text-xl font-extrabold">
                    {{ satisfactionScore.toFixed(1) }}<span class="text-sm">/5</span>
                  </p>
                  <p class="text-ink-muted text-[11px]">최근 30일</p>
                </AppCard>
                <RouterLink
                  :to="{
                    name: 'behavior-reviews',
                    params: { behaviorId: selected.behaviorId },
                  }"
                  class="border-line bg-surface rounded-card border p-4 text-left"
                  aria-label="회고 내역 보기"
                >
                  <p class="text-ink-muted flex items-center gap-1 text-xs">
                    <IconMessage2 :size="14" /> 회고 건수
                  </p>
                  <p class="text-ink mt-1 text-xl font-extrabold">
                    {{ selected.retrospectCount }}건
                  </p>
                  <p class="text-ink-muted text-[11px]">최근 30일</p>
                </RouterLink>
              </div>
            </div>

            <div
              v-if="selected.prescription"
              class="bg-brand/5 rounded-2xl p-4"
            >
              <p class="text-brand flex items-center gap-1.5 text-sm font-semibold">
                <IconBulb :size="15" /> AI 인사이트
              </p>
              <p class="text-ink mt-2 text-sm leading-relaxed">{{ selected.prescription }}</p>
            </div>

            <div class="space-y-2">
              <PrimaryButton
                v-if="selected.cta"
                @click="$router.push('/chat')"
                >{{ selected.cta.label }}</PrimaryButton
              >
              <PrimaryButton
                variant="outline"
                @click="subview = 'transactions'"
                >거래 내역 보기</PrimaryButton
              >
            </div>
          </template>

          <template v-else-if="subview === 'behavior'">
            <p
              v-if="transactionsLoading"
              class="text-ink-muted py-10 text-center text-sm"
            >
              행동 상세를 불러오는 중이에요.
            </p>
            <div
              v-else-if="transactionsError"
              class="border-line space-y-3 rounded-2xl border p-4 text-center"
            >
              <p class="text-ink-muted text-sm">{{ transactionsError }}</p>
              <PrimaryButton
                variant="outline"
                @click="loadTransactions(selectedId)"
                >다시 시도</PrimaryButton
              >
            </div>
          </template>

          <template v-else-if="selected">
            <div class="flex items-center gap-3">
              <span
                class="flex size-12 shrink-0 items-center justify-center rounded-full"
                :class="VERDICT_SOFT_BG_CLASS[selectedTone]"
              >
                <IconMoonStars
                  :size="22"
                  :stroke-width="1.5"
                  :class="VERDICT_TEXT_CLASS[selectedTone]"
                />
              </span>
              <div>
                <p class="text-ink font-bold">{{ selected.name }}</p>
                <p class="text-ink-muted text-xs">이 묶음에 배정된 거래예요</p>
              </div>
            </div>

            <p
              v-if="transactionsLoading"
              class="text-ink-muted py-10 text-center text-sm"
            >
              거래 내역을 불러오는 중이에요.
            </p>

            <div
              v-else-if="transactionsError"
              class="border-line space-y-3 rounded-2xl border p-4 text-center"
            >
              <p class="text-ink-muted text-sm">{{ transactionsError }}</p>
              <PrimaryButton
                variant="outline"
                @click="loadTransactions(selectedId)"
                >다시 시도</PrimaryButton
              >
            </div>

            <p
              v-else-if="transactions.length === 0"
              class="text-ink-muted border-line rounded-2xl border p-6 text-center text-sm"
            >
              이 묶음에 배정된 거래가 아직 없어요.
            </p>

            <template v-else>
              <div class="flex items-center justify-between">
                <p class="text-ink text-sm font-semibold">
                  거래 내역
                  <span class="text-ink-muted font-normal">(총 {{ transactions.length }}건)</span>
                </p>
                <p class="text-ink text-sm font-bold">
                  총 {{ transactionsTotal.toLocaleString('ko-KR') }}원
                </p>
              </div>

              <div class="space-y-2">
                <div
                  v-for="tx in transactions"
                  :key="tx.id"
                  class="border-line flex items-center gap-3 rounded-2xl border p-3"
                >
                  <MerchantBadge :name="tx.merchant" />
                  <span class="flex-1">
                    <span class="text-ink block text-sm font-semibold">{{ tx.merchant }}</span>
                    <span class="text-ink-muted block text-xs">{{ tx.at }}</span>
                  </span>
                  <span class="text-right">
                    <span class="text-ink block text-sm font-bold"
                      >{{ tx.amount.toLocaleString('ko-KR') }}원</span
                    >
                    <span
                      class="bg-surface-muted text-ink-muted mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    >
                      {{ tx.category }}
                    </span>
                  </span>
                </div>
              </div>
            </template>

            <p
              class="text-ink-muted bg-surface-muted flex items-center gap-2 rounded-2xl p-3 text-xs"
            >
              <IconMoodSmile
                :size="16"
                class="shrink-0"
              />
              이 묶음과 하위 묶음에 배정된 거래를 모두 보여드려요.
            </p>
          </template>
        </div>
      </Transition>
    </main>

    <AppBottomNav />
  </div>
</template>
