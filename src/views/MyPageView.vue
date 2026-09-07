<script setup lang="ts">
import { computed } from 'vue'
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
import maleProfile from '@/assets/images/profile/남자프로필.png'
import femaleProfile from '@/assets/images/profile/여자프로필.png'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

function readUserField(field: string) {
  const user: unknown = userStore.me
  if (!user || typeof user !== 'object') return undefined
  return Reflect.get(user, field)
}

const profileImage = computed(() => {
  const gender = readUserField('gender')
  return gender === 'MALE' || gender === '남성' || gender === '남자' ? maleProfile : femaleProfile
})

const displayName = computed(() => {
  const name = readUserField('name') ?? readUserField('nickname')
  return typeof name === 'string' && name.trim() ? name.trim() : '예리'
})

const stats = [
  { label: '목표 달성률', value: '31%' },
  { label: '이번 달 절감액', value: '46,000원' },
  { label: '연속 회고', value: '7일' },
]

const menu = [
  {
    label: '월 예산 설정',
    desc: '예산을 다시 설정할 수 있어요',
    icon: IconWallet,
    to: '/me/budget',
  },
  {
    label: '목표 자금 관리',
    desc: '여행 · 비상금 · 저축 목표를 관리해요',
    icon: IconTarget,
    to: '/me/goals',
  },
  {
    label: '소비 분석 민감도',
    desc: '분석 기준과 가중치를 조정해요',
    icon: IconChartBar,
    to: '/me/analysis-settings',
  },
]
</script>

<template>
  <div class="flex h-full flex-col">
    <AppTopBar
      title="마이페이지"
      bell
      bell-dot
    />

    <main class="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
      <section class="bg-brand-soft rounded-[20px] p-4 pt-4">
        <button
          type="button"
          class="flex w-full items-center gap-4 text-left"
        >
          <span class="relative flex size-[92px] shrink-0 items-center justify-center rounded-full">
            <img
              :src="profileImage"
              :alt="`${displayName} 프로필`"
              class="size-full rounded-full object-cover"
            />
            <span
              class="bg-surface border-line absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border"
            >
              <IconPencil
                :size="14"
                class="text-ink-muted"
              />
            </span>
          </span>
          <span class="text-ink flex-1 text-lg font-bold">{{ displayName }}님</span>
          <IconChevronRight
            :size="18"
            class="text-ink-muted"
          />
        </button>

        <div
          class="bg-surface divide-line mt-4 grid grid-cols-3 divide-x rounded-2xl py-3 text-center"
        >
          <div
            v-for="stat in stats"
            :key="stat.label"
          >
            <p class="text-ink-muted text-[11px]">{{ stat.label }}</p>
            <p class="text-ink mt-1 text-sm font-extrabold">{{ stat.value }}</p>
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <button
          v-for="item in menu"
          :key="item.label"
          type="button"
          class="border-line flex min-h-20 w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left"
          @click="router.push(item.to)"
        >
          <span
            class="bg-brand-soft flex size-12 shrink-0 items-center justify-center rounded-full"
          >
            <component
              :is="item.icon"
              :size="22"
              class="text-brand"
              :stroke-width="1.7"
            />
          </span>
          <span class="min-w-0 flex-1">
            <span class="text-ink block text-base font-semibold">{{ item.label }}</span>
            <span class="text-ink-muted mt-0.5 block text-xs">{{ item.desc }}</span>
          </span>
          <IconChevronRight
            :size="18"
            class="text-ink-muted shrink-0"
          />
        </button>
      </section>

      <button
        type="button"
        class="bg-surface-muted text-ink-muted flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold"
        @click="router.push('/login')"
      >
        <IconLogout :size="18" />
        로그아웃
      </button>
    </main>

    <AppBottomNav />
  </div>
</template>
