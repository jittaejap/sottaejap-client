<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { IconBulb, IconClipboardText } from '@tabler/icons-vue'

import type { NotificationItem } from '@/api/types'
import { getNotifications, readNotification } from '@/api/service'
import AppBottomNav from '@/components/common/AppBottomNav.vue'
import AppTopBar from '@/components/common/AppTopBar.vue'

const notifications = ref<NotificationItem[]>([])
const loadError = ref('')

const groups = computed(() => [
  {
    label: '알림',
    items: notifications.value.map((item) => ({
      id: item.id,
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
    })),
  },
])

onMounted(async () => {
  try {
    notifications.value = (await getNotifications()).notifications
  } catch {
    loadError.value = '알림을 불러오지 못했어요.'
  }
})

async function markRead(item: { id: number; unread: boolean }) {
  if (!item.unread) return
  try {
    await readNotification(item.id)
    const target = notifications.value.find((notification) => notification.id === item.id)
    if (target) target.isRead = true
  } catch {
    loadError.value = '알림을 읽음 처리하지 못했어요.'
  }
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
        <RouterLink
          v-for="item in group.items"
          :key="item.id"
          to="/chat"
          class="border-line bg-surface flex items-start gap-3 rounded-2xl border p-4"
          @click="markRead(item)"
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
