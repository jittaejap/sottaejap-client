import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { UserMe } from '@/api/types'

export const useUserStore = defineStore('user', () => {
  /** `GET /users/me` 결과. 로그인 전이나 로그아웃 후에는 null. */
  const me = ref<UserMe | null>(null)

  /** FR-09-03 — false면 2-1 온보딩으로 보낸다. */
  const onboardingCompleted = computed(() => me.value?.onboardingCompleted ?? false)

  return { me, onboardingCompleted }
})
