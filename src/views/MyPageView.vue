<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  IconChartBar,
  IconChevronRight,
  IconLogout,
  IconPencil,
  IconTarget,
  IconWallet,
} from '@tabler/icons-vue'

import AppBottomNav from '@/components/common/AppBottomNav.vue'
import AppTopBar from '@/components/common/AppTopBar.vue'

const router = useRouter()

const stats = [
  { label: '목표 달성률', value: '31%' },
  { label: '이번 달 절감액', value: '46,000원' },
  { label: '연속 회고', value: '7일' },
]

const menu = [
  { label: '월 예산 설정', desc: '예산을 다시 설정할 수 있어요', icon: IconWallet },
  { label: '목표 자금 관리', desc: '여행 · 비상금 · 저축 목표를 관리해요', icon: IconTarget },
  { label: '소비 분석 민감도', desc: '분석 기준과 가중치를 조정해요', icon: IconChartBar },
]
</script>

<template>
  <div class="flex h-full flex-col">
    <AppTopBar
      title="마이페이지"
      bell
    />

    <main class="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
      <div class="bg-brand/5 rounded-2xl p-4">
        <div class="flex items-center gap-4">
          <span
            class="bg-surface relative flex size-20 shrink-0 items-center justify-center rounded-full text-3xl"
          >
            🙋‍♀️
            <span
              class="bg-surface border-line absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border"
            >
              <IconPencil
                :size="14"
                class="text-ink-muted"
              />
            </span>
          </span>
          <p class="text-ink flex-1 text-lg font-bold">예리님 🌱</p>
          <IconChevronRight
            :size="18"
            class="text-ink-muted"
          />
        </div>

        <div
          class="bg-surface divide-line mt-4 grid grid-cols-3 divide-x rounded-2xl py-3 text-center"
        >
          <div
            v-for="s in stats"
            :key="s.label"
          >
            <p class="text-ink-muted text-[11px]">{{ s.label }}</p>
            <p class="text-ink mt-1 text-sm font-extrabold">{{ s.value }}</p>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <button
          v-for="m in menu"
          :key="m.label"
          type="button"
          class="border-line flex w-full items-center gap-3 rounded-2xl border p-4 text-left"
        >
          <span class="bg-brand/10 flex size-12 shrink-0 items-center justify-center rounded-full">
            <component
              :is="m.icon"
              :size="22"
              class="text-brand"
              :stroke-width="1.5"
            />
          </span>
          <span class="flex-1">
            <span class="text-ink block font-semibold">{{ m.label }}</span>
            <span class="text-ink-muted block text-xs">{{ m.desc }}</span>
          </span>
          <IconChevronRight
            :size="18"
            class="text-ink-muted"
          />
        </button>
      </div>

      <button
        type="button"
        class="bg-surface-muted text-ink-muted flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold"
        @click="router.push('/login')"
      >
        <IconLogout :size="18" />
        로그아웃
      </button>
    </main>

    <AppBottomNav />
  </div>
</template>
