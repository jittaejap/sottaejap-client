<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconMessageCircle, IconUserCircle } from '@tabler/icons-vue'

import heroImage from '@/assets/images/login/hero.png'
import logoImage from '@/assets/images/login/logo.png'
import { getCurrentUser, loginKakao, loginLocal } from '@/api/service'
import { setAccessToken } from '@/api/httpClient'

const router = useRouter()
const loginError = ref('')
const loggingIn = ref(false)
const kakaoStateKey = 'sottaejap-kakao-oauth-state'

async function finishLogin(accessToken: string) {
  setAccessToken(accessToken)
  const user = await getCurrentUser()
  await router.replace(user.onboardingCompleted ? '/' : '/onboarding')
}

async function startDemo() {
  loggingIn.value = true
  loginError.value = ''
  try {
    await finishLogin((await loginLocal()).accessToken)
  } catch {
    setAccessToken(null)
    loginError.value = '로그인하지 못했어요. 잠시 후 다시 시도해주세요.'
  } finally {
    loggingIn.value = false
  }
}

function startKakao() {
  const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY
  if (!clientId) {
    loginError.value = '카카오 로그인 설정을 확인해주세요.'
    return
  }
  const state = crypto.randomUUID()
  const redirectUri = `${window.location.origin}/login`
  sessionStorage.setItem(kakaoStateKey, state)
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
  const expectedState = sessionStorage.getItem(kakaoStateKey)
  sessionStorage.removeItem(kakaoStateKey)
  window.history.replaceState({}, '', '/login')
  if (!state || state !== expectedState) {
    loginError.value = '카카오 로그인 요청을 확인할 수 없어요. 다시 시도해주세요.'
    return
  }
  loggingIn.value = true
  try {
    const redirectUri = `${window.location.origin}/login`
    await finishLogin((await loginKakao(code, redirectUri)).accessToken)
  } catch {
    setAccessToken(null)
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
