<script setup lang="ts">
import { useRouter } from 'vue-router'
import { IconBell, IconChevronLeft, IconSettings } from '@tabler/icons-vue'

const props = withDefaults(
  defineProps<{
    title?: string
    back?: boolean
    /** 지정하면 라우터 이동 대신 이 함수를 호출한다 (뷰 내부 서브 상태 복귀 등). */
    backHandler?: () => void
    bell?: boolean
    bellDot?: boolean
    settings?: boolean
  }>(),
  {
    title: undefined,
    back: true,
    backHandler: undefined,
    bell: false,
    bellDot: false,
    settings: true,
  },
)

const router = useRouter()

function handleBack() {
  if (props.backHandler) props.backHandler()
  else router.back()
}
</script>

<template>
  <header class="flex h-14 shrink-0 items-center justify-between px-4">
    <button
      v-if="back"
      type="button"
      class="text-ink -ml-2 flex size-9 items-center justify-center"
      aria-label="뒤로"
      @click="handleBack"
    >
      <IconChevronLeft :size="24" />
    </button>
    <div
      v-else
      class="size-9"
    ></div>

    <h1
      v-if="title"
      class="text-ink truncate text-base font-semibold"
    >
      {{ title }}
    </h1>
    <div
      v-else
      class="flex-1"
    ></div>

    <div class="-mr-2 flex items-center gap-1">
      <RouterLink
        v-if="bell"
        to="/notifications"
        class="text-ink relative flex size-9 items-center justify-center"
        aria-label="알림"
      >
        <IconBell :size="22" />
        <span
          v-if="bellDot"
          class="bg-verdict-adjust absolute top-2 right-2 size-1.5 rounded-full"
        ></span>
      </RouterLink>
      <RouterLink
        v-if="settings"
        to="/me"
        class="text-ink flex size-9 items-center justify-center"
        aria-label="설정"
      >
        <IconSettings :size="22" />
      </RouterLink>
    </div>
  </header>
</template>
