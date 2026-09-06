<script setup lang="ts">
import { useRouter } from 'vue-router'
import { IconMessageCircle, IconUserCircle } from '@tabler/icons-vue'

import heroImage from '@/assets/images/login/hero.png'
import logoImage from '@/assets/images/login/logo.png'

const router = useRouter()

function startDemo() {
  void router.push('/onboarding')
}
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
        @click="startDemo"
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
        @click="startDemo"
      >
        <IconUserCircle :size="21" />
        데모 계정으로 시작하기
      </button>
    </div>

    <p
      class="text-ink-muted absolute right-6 bottom-[34px] left-6 text-center text-xs leading-[18px]"
    >
      로그인하면 서비스 이용약관 및 개인정보처리방침에<br />동의하게 됩니다.
    </p>
  </div>
</template>
