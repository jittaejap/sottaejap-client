<script setup lang="ts">
import { IconBell, IconBulb, IconClipboardText, IconTrendingUp } from '@tabler/icons-vue'

import type { NotificationType } from '@/api/enums'
import AppBottomNav from '@/components/common/AppBottomNav.vue'
import AppTopBar from '@/components/common/AppTopBar.vue'

const groups: {
  label: string
  items: {
    type: NotificationType
    title: string
    body: string
    at: string
    unread: boolean
    icon: typeof IconBell
  }[]
}[] = [
  {
    label: '오늘',
    items: [
      {
        type: 'RETROSPECT_DUE',
        title: 'D+1 회고 요청',
        body: '어제 소비를 돌아보고 오늘의 선택을 더 현명하게 만들어보세요.',
        at: '오전 9:00',
        unread: true,
        icon: IconBell,
      },
    ],
  },
  {
    label: '어제',
    items: [
      {
        type: 'RETROSPECT_DUE',
        title: '회고 요청',
        body: '오늘의 소비를 회고하고 지출 패턴을 확인해보세요.',
        at: '오후 9:30',
        unread: false,
        icon: IconClipboardText,
      },
    ],
  },
  {
    label: '이번 주',
    items: [
      {
        type: 'SUGGESTION',
        title: '개선방안이 도착했어요',
        body: 'AI가 소비 패턴을 바탕으로 새로운 개선방안을 제안했어요.',
        at: '5월 16일 (목)',
        unread: false,
        icon: IconBulb,
      },
      {
        type: 'SUGGESTION',
        title: '연속 회고 3일째예요',
        body: '3일 연속 회고를 이어가고 있어요. 지금 흐름을 계속 유지해보세요!',
        at: '5월 15일 (수)',
        unread: false,
        icon: IconTrendingUp,
      },
    ],
  },
]
</script>

<template>
  <div class="flex h-full flex-col">
    <AppTopBar title="알림" />

    <main class="flex-1 space-y-5 overflow-y-auto px-4 pb-6">
      <section
        v-for="group in groups"
        :key="group.label"
        class="space-y-2"
      >
        <h2 class="text-ink-muted text-sm font-semibold">{{ group.label }}</h2>
        <RouterLink
          v-for="item in group.items"
          :key="item.title"
          to="/chat"
          class="border-line bg-surface flex items-start gap-3 rounded-2xl border p-4"
        >
          <span
            class="flex size-12 shrink-0 items-center justify-center rounded-full"
            :class="item.type === 'RETROSPECT_DUE' ? 'bg-brand/10' : 'bg-satisfaction-high/10'"
          >
            <component
              :is="item.icon"
              :size="22"
              :stroke-width="1.5"
              :class="item.type === 'RETROSPECT_DUE' ? 'text-brand' : 'text-satisfaction-high'"
            />
          </span>
          <span class="flex-1">
            <span class="text-ink block font-semibold">{{ item.title }}</span>
            <span class="text-ink-muted mt-1 block text-sm leading-relaxed">{{ item.body }}</span>
            <span class="text-ink-faint mt-2 block text-xs">{{ item.at }}</span>
          </span>
          <span
            class="mt-1 size-2 shrink-0 rounded-full"
            :class="item.unread ? 'bg-brand' : 'bg-line'"
          ></span>
        </RouterLink>
      </section>
    </main>

    <AppBottomNav />
  </div>
</template>
