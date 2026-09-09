<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconBulb, IconClipboardText } from '@tabler/icons-vue'

import type { NotificationType } from '@/api/enums'
import type { NotificationItem } from '@/api/types'
import { getNotifications, readNotification } from '@/api/service'
import { apiErrorMessage } from '@/api/errorMessage'
import AppBottomNav from '@/components/common/AppBottomNav.vue'
import AppTopBar from '@/components/common/AppTopBar.vue'

const router = useRouter()

const notifications = ref<NotificationItem[]>([])
const loadError = ref('')

type DisplayNotification = {
  id: number
  refId: number
  type: NotificationType
  title: string
  body: string
  at: string
  unread: boolean
  icon: typeof IconClipboardText
  createdAt: string
}

function groupLabel(createdAt: string) {
  const now = new Date()
  const date = new Date(createdAt)
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayDiff = Math.floor(
    (startToday.getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      86_400_000,
  )
  if (dayDiff <= 0) return '오늘'
  if (dayDiff === 1) return '어제'
  if (dayDiff < 7) return '이번 주'
  return '이전 알림'
}

const groups = computed(() => {
  const grouped = new Map<string, DisplayNotification[]>()
  for (const item of notifications.value) {
    const display: DisplayNotification = {
      id: item.id,
      refId: item.refId,
      type: item.type,
      title: item.type === 'RETROSPECT_DUE' ? '회고 요청' : '개선방안이 도착했어요',
      body: item.message,
      at: new Intl.DateTimeFormat('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(item.createdAt)),
      unread: !item.isRead,
      icon: item.type === 'RETROSPECT_DUE' ? IconClipboardText : IconBulb,
      createdAt: item.createdAt,
    }
    const label = groupLabel(item.createdAt)
    grouped.set(label, [...(grouped.get(label) ?? []), display])
  }
  return ['오늘', '어제', '이번 주', '이전 알림']
    .filter((label) => grouped.has(label))
    .map((label) => ({ label, items: grouped.get(label)! }))
})

onMounted(async () => {
  try {
    notifications.value = (await getNotifications()).notifications
  } catch (error) {
    loadError.value = apiErrorMessage(error, '알림을 불러오지 못했어요.')
  }
})

async function openNotification(item: DisplayNotification) {
  loadError.value = ''
  if (item.unread) {
    try {
      await readNotification(item.id)
      const target = notifications.value.find((notification) => notification.id === item.id)
      if (target) target.isRead = true
    } catch (error) {
      loadError.value = apiErrorMessage(error, '알림을 읽음 처리하지 못했어요. 다시 눌러주세요.')
      return
    }
  }
  await router.push({
    name: 'chat',
    query:
      item.type === 'RETROSPECT_DUE'
        ? { mode: 'retrospect', transactionId: String(item.refId) }
        : { mode: 'analysis', step: 'improvement', suggestionId: String(item.refId) },
  })
}
</script>

<template>
  <div class="flex h-full flex-col">
    <AppTopBar title="알림" />

    <main class="flex-1 space-y-5 overflow-y-auto px-4 pb-6">
      <p
        v-if="loadError"
        class="text-brand text-sm"
      >
        {{ loadError }}
      </p>
      <section
        v-for="group in groups"
        :key="group.label"
        class="space-y-2"
      >
        <h2 class="text-ink-muted text-sm font-semibold">{{ group.label }}</h2>
        <button
          v-for="item in group.items"
          :key="item.id"
          type="button"
          class="border-line bg-surface flex w-full items-start gap-3 rounded-2xl border p-4 text-left"
          @click="openNotification(item)"
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
        </button>
      </section>
    </main>

    <AppBottomNav />
  </div>
</template>
