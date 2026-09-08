import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { setAccessToken } from '@/api/httpClient'
import { getCurrentUser } from '@/api/service'
import type { UserMe } from '@/api/types'

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
    if (me.value === null) return
    me.value = { ...me.value, onboardingCompleted: true }
  }

  /** 로그아웃. 토큰을 httpClient에서도 지워야 다음 요청에 Authorization이 실리지 않는다. */
  function signOut() {
    accessToken.value = null
    setAccessToken(null)
    me.value = null
  }

  return {
    me,
    accessToken,
    signedIn,
    onboardingCompleted,
    signIn,
    markOnboardingCompleted,
    signOut,
  }
})
