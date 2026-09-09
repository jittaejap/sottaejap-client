<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconMessageCircle, IconUserCircle } from '@tabler/icons-vue'

import heroImage from '@/assets/images/login/hero.png'
import logoImage from '@/assets/images/login/logo.png'
import { loginKakao, loginLocal } from '@/api/service'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loginError = ref('')
const loggingIn = ref(false)
const kakaoStateKey = 'sottaejap-kakao-oauth-state'
// 카카오는 전체 페이지를 떠났다 돌아오므로 `redirect` 쿼리가 살아남지 않는다. `state`처럼 세션에 둔다.
const kakaoRedirectKey = 'sottaejap-kakao-oauth-redirect'

// 사이트 데이터 차단·일부 프라이빗 모드에서는 `sessionStorage` 접근이 던진다. user store와 같은 이유로 감싼다.
function writeSession(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/** 한 번 읽고 지운다. `state`와 돌아갈 경로는 왕복 한 번에만 쓴다. */
function takeSession(key: string) {
  try {
    const value = sessionStorage.getItem(key)
    sessionStorage.removeItem(key)
    return value
  } catch {
    return null
  }
}

/**
 * 진입 가드가 남긴 `redirect` 쿼리. 로그아웃 상태에서 열었던 경로를 로그인 뒤 그대로 연다.
 * 문자열 검사 대신 URL 파서로 같은 출처인지 본다. `//evil.example`은 물론 `/\\evil.example`처럼
 * 파서가 다른 출처로 읽는 값도 홈으로 바꾼다.
 */
function loginRedirectTarget(value: unknown) {
  if (typeof value !== 'string') return '/'
  try {
    const url = new URL(value, window.location.origin)
    return url.origin === window.location.origin ? url.pathname + url.search + url.hash : '/'
  } catch {
    // 파서가 거부하는 값(`http://[` 등). 걸러내는 게 이 함수의 일이라 여기서 죽으면 안 된다.
    return '/'
  }
}

// 토큰과 `GET /users/me` 결과를 스토어가 함께 보관한다. 진입 가드가 그 값을 근거로 분기한다.
async function finishLogin(accessToken: string, redirectTarget: string) {
  await userStore.signIn(accessToken)
  await router.replace(userStore.onboardingCompleted ? redirectTarget : '/onboarding')
}

async function startDemo() {
  loggingIn.value = true
  loginError.value = ''
  try {
    const { accessToken } = await loginLocal()
    await finishLogin(accessToken, loginRedirectTarget(route.query.redirect))
  } catch {
    userStore.signOut()
    loginError.value = '로그인하지 못했어요. 잠시 후 다시 시도해주세요.'
  } finally {
    loggingIn.value = false
  }
}

function startKakao() {
  const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID
  const redirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI
  if (!clientId || !redirectUri) {
    loginError.value = '카카오 로그인 설정을 확인해주세요.'
    return
  }
  const state = crypto.randomUUID()
  // 저장소가 막히면 돌아왔을 때 `state`를 대조할 수 없다. 카카오로 넘어가기 전에 알린다.
  if (
    !writeSession(kakaoStateKey, state) ||
    !writeSession(kakaoRedirectKey, loginRedirectTarget(route.query.redirect))
  ) {
    loginError.value = '카카오 로그인 요청을 확인할 수 없어요. 다시 시도해주세요.'
    return
  }
  const authorize = new URL('https://kauth.kakao.com/oauth/authorize')
  authorize.searchParams.set('client_id', clientId)
  authorize.searchParams.set('redirect_uri', redirectUri)
  authorize.searchParams.set('response_type', 'code')
  authorize.searchParams.set('state', state)
  window.location.assign(authorize)
}

onMounted(async () => {
  const query = new URLSearchParams(window.location.search)
  const code = query.get('code')
  if (!code) return
  const state = query.get('state')
  const expectedState = takeSession(kakaoStateKey)
  const redirectTarget = loginRedirectTarget(takeSession(kakaoRedirectKey))
  window.history.replaceState({}, '', '/auth/callback')
  if (!state || state !== expectedState) {
    loginError.value = '카카오 로그인 요청을 확인할 수 없어요. 다시 시도해주세요.'
    return
  }
  loggingIn.value = true
  try {
    const redirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI
    if (!redirectUri) {
      loginError.value = '카카오 로그인 설정을 확인해주세요.'
      return
    }
    const { accessToken } = await loginKakao(code, redirectUri)
    await finishLogin(accessToken, redirectTarget)
  } catch {
    userStore.signOut()
    loginError.value = '카카오 로그인에 실패했어요. 다시 시도해주세요.'
  } finally {
    loggingIn.value = false
  }
})
</script>

<template>
  <div
    class="bg-surface relative mx-auto h-full min-h-[844px] w-full max-w-[390px] overflow-hidden"
  >
    <img
      :src="logoImage"
      alt="소때잡"
      class="absolute top-8 left-[55px] h-[180px] w-[280px] object-contain"
    />

    <img
      :src="heroImage"
      alt="소비 목표를 계획하는 모습"
      class="absolute top-[232px] left-6 h-[260px] w-[342px] rounded-[37px] object-cover"
    />

    <div class="absolute top-[547px] left-6 flex w-[342px] flex-col gap-3">
      <button
        type="button"
        class="bg-kakao text-ink flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold"
        :disabled="loggingIn"
        @click="startKakao"
      >
        <IconMessageCircle
          :size="20"
          fill="currentColor"
        />
        카카오로 시작하기
      </button>
      <button
        type="button"
        class="border-line bg-surface text-ink flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border text-base font-semibold"
        :disabled="loggingIn"
        @click="startDemo"
      >
        <IconUserCircle :size="21" />
        데모 계정으로 시작하기
      </button>
    </div>

    <p
      v-if="loginError"
      role="alert"
      class="text-brand absolute top-[670px] right-6 left-6 text-center text-xs"
    >
      {{ loginError }}
    </p>

    <p
      class="text-ink-muted absolute right-6 bottom-[34px] left-6 text-center text-xs leading-[18px]"
    >
      로그인하면 서비스 이용약관 및 개인정보처리방침에<br />동의하게 됩니다.
    </p>
  </div>
</template>
