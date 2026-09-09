import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { setAccessToken } from '@/api/httpClient'
import { getCurrentUser } from '@/api/service'
import type { UserMe } from '@/api/types'
import { useChatStore } from '@/stores/chat'

/**
 * 새로고침 뒤 세션을 되살리기 위한 `sessionStorage` 키. 카카오 `state`와 같은 저장소를 쓴다.
 * 탭을 닫으면 사라진다 — `localStorage`로 옮기는 것은 별도 결정 사항이다 (#9 제외 범위).
 */
const accessTokenStorageKey = 'sottaejap-access-token'

/**
 * 저장소는 있으면 쓰고 없으면 세션이 안 남을 뿐이다. 사이트 데이터 차단·일부 프라이빗 모드에서는
 * `sessionStorage` 접근 자체가 던지는데, 그때 로그인이나 복원까지 실패하면 안 된다.
 */
function readStoredToken() {
  try {
    return sessionStorage.getItem(accessTokenStorageKey)
  } catch {
    return null
  }
}

function writeStoredToken(token: string | null) {
  try {
    if (token === null) sessionStorage.removeItem(accessTokenStorageKey)
    else sessionStorage.setItem(accessTokenStorageKey, token)
  } catch {
    // 저장소가 막힌 브라우저. 이번 탭에서는 새로고침하면 다시 로그인한다.
  }
}

export const useUserStore = defineStore('user', () => {
  /** `GET /users/me` 결과. 로그인 전이나 로그아웃 후에는 null. */
  const me = ref<UserMe | null>(null)

  /**
   * 발급받은 JWT. httpClient의 모듈 변수와 값을 맞춰 두고, 진입 분기는 이 값 하나로
   * 로그인 여부를 판단한다. 새로고침하면 메모리에서 사라지므로 `restore()`가 `sessionStorage`에서
   * 되살린다.
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
    writeStoredToken(token)
    try {
      me.value = await getCurrentUser()
    } catch (error) {
      signOut()
      throw error
    }
  }

  /**
   * 새로고침 뒤 저장해 둔 토큰으로 세션을 되살린다. 진입 가드가 첫 내비게이션에서 기다린다.
   *
   * 토큰만 되살리면 `signedIn`은 true인데 `onboardingCompleted`는 false가 되어 온보딩을 마친
   * 사람도 2-1 온보딩으로 되튕긴다. 그래서 `signIn()`을 그대로 타서 `GET /users/me`까지 끝낸다.
   * 토큰이 만료됐거나 조회가 실패하면 `signIn()`이 이미 로그아웃 상태로 되돌렸으므로 그대로 둔다.
   *
   * 여러 내비게이션이 동시에 기다려도 조회는 한 번만 하도록 첫 호출의 약속을 돌려준다.
   * 그 약속이 거부되면 캐시된 채로 모든 내비게이션이 막히므로, 이 함수는 절대 reject하지 않는다.
   */
  let restoring: Promise<void> | null = null
  function restore() {
    restoring ??= (async () => {
      const token = readStoredToken()
      if (token === null) return
      try {
        await signIn(token)
      } catch {
        // 저장된 토큰이 더는 유효하지 않다. 1L 로그인부터 다시 시작한다.
      }
    })()
    return restoring
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

  function replaceMe(value: UserMe) {
    me.value = value
  }

  /** 로그아웃. 인증정보와 사용자별 메모리 상태를 함께 지워 계정 간 데이터가 섞이지 않게 한다. */
  function signOut() {
    accessToken.value = null
    setAccessToken(null)
    writeStoredToken(null)
    me.value = null
    useChatStore().reset()
  }

  return {
    me,
    signedIn,
    onboardingCompleted,
    signIn,
    restore,
    markOnboardingCompleted,
    replaceMe,
    signOut,
  }
})
