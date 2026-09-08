import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { setAccessToken } from '@/api/httpClient'
import { getCurrentUser } from '@/api/service'
import type { UserMe } from '@/api/types'
import { useChatStore } from '@/stores/chat'

export const useUserStore = defineStore('user', () => {
  /** `GET /users/me` 결과. 로그인 전이나 로그아웃 후에는 null. */
  const me = ref<UserMe | null>(null)

  /**
   * 발급받은 JWT. httpClient의 모듈 변수와 값을 맞춰 두고, 진입 분기는 이 값 하나로
   * 로그인 여부를 판단한다. 새로고침하면 사라지므로 1L 로그인부터 다시 시작한다.
   */
  const accessToken = ref<string | null>(null)

  /** FR-09-03 — false면 어느 경로로 들어와도 1L 로그인으로 보낸다. */
  const signedIn = computed(() => accessToken.value !== null)

  /** FR-09-03 — false면 2-1 온보딩으로 보낸다. */
  const onboardingCompleted = computed(() => me.value?.onboardingCompleted ?? false)

  /**
   * 로그인 성공 직후 호출한다. 토큰을 먼저 세워야 `GET /users/me`에 Authorization이 실린다.
   * 사용자 조회가 실패하면 토큰만 남은 반쪽 상태가 되므로 토큰까지 되돌린다.
   */
  async function signIn(token: string) {
    accessToken.value = token
    setAccessToken(token)
    try {
      me.value = await getCurrentUser()
    } catch (error) {
      signOut()
      throw error
    }
  }

  /**
   * `POST /onboarding/complete` 성공 후 호출한다. 이 갱신이 없으면 홈으로 이동하는 순간
   * 진입 분기가 다시 2-1 온보딩으로 되돌린다.
   */
  function markOnboardingCompleted() {
    if (me.value === null) {
      // 가드가 me 없이 온보딩에 머무는 것을 막으므로 지금은 도달하지 않는다.
      // 도달했다면 signIn()과 가드 중 한쪽이 깨진 것이다.
      if (import.meta.env.DEV) console.warn('[user] me 없이 온보딩 완료를 호출했다')
      return
    }
    me.value = { ...me.value, onboardingCompleted: true }
  }

  /** 로그아웃. 인증정보와 사용자별 메모리 상태를 함께 지워 계정 간 데이터가 섞이지 않게 한다. */
  function signOut() {
    accessToken.value = null
    setAccessToken(null)
    me.value = null
    useChatStore().reset()
  }

  return {
    me,
    signedIn,
    onboardingCompleted,
    signIn,
    markOnboardingCompleted,
    signOut,
  }
})
