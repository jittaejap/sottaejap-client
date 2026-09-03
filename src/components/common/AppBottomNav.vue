<script setup lang="ts">
import { useRoute } from 'vue-router'
import { IconChartPie2, IconHome2, IconListDetails, IconMessageCircle2 } from '@tabler/icons-vue'

const route = useRoute()

const tabs = [
  { name: 'home', to: '/', label: '홈', icon: IconHome2 },
  { name: 'chat', to: '/chat', label: 'AI채팅', icon: IconMessageCircle2 },
  { name: 'map', to: '/map', label: '분석', icon: IconChartPie2 },
  { name: 'transactions', to: '/transactions', label: '거래내역', icon: IconListDetails },
] as const
</script>

<template>
  <nav class="border-line bg-surface flex shrink-0 border-t">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.name"
      :to="tab.to"
      class="flex flex-1 flex-col items-center gap-1 py-2.5"
      :class="route.name === tab.name ? 'text-brand' : 'text-ink-muted'"
    >
      <component
        :is="tab.icon"
        :size="24"
        :stroke-width="1.75"
      />
      <span class="text-[11px] leading-none font-medium">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>
