<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  IconBrandApple,
  IconBrandGoogle,
  IconBrandKakaoTalk,
  IconMail,
  IconSparkles,
} from '@tabler/icons-vue'

const router = useRouter()

function startDemo() {
  void router.push('/onboarding')
}
</script>

<template>
  <div class="flex h-full flex-col">
    <main class="flex flex-1 flex-col items-center px-6 pt-16">
      <div class="flex items-center gap-1">
        <h1 class="text-ink text-2xl font-extrabold tracking-tight">소때잡</h1>
        <IconSparkles
          class="text-brand -mt-3"
          :size="18"
        />
      </div>
      <p class="text-ink-muted mt-3 text-center text-sm leading-relaxed">
        AI가 함께하는 똑똑한 소비 습관,<br />
        <span class="text-brand font-semibold">미래를 바꾸는 작은 선택.</span>
      </p>

      <div class="relative mt-10 flex w-full max-w-[280px] items-center justify-center">
        <div class="bg-brand/10 absolute inset-4 rounded-[40%] blur-2xl"></div>
        <svg
          viewBox="0 0 280 220"
          class="relative w-full"
        >
          <rect
            x="18"
            y="20"
            width="160"
            height="104"
            rx="10"
            class="fill-surface"
            stroke="var(--color-line)"
            stroke-width="2"
          />
          <path
            d="M32 96 L70 68 L100 82 L138 40 L162 56"
            fill="none"
            stroke="var(--color-brand)"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle
            cx="162"
            cy="56"
            r="6"
            class="fill-brand"
          />

          <circle
            cx="120"
            cy="150"
            r="46"
            fill="none"
            stroke="var(--color-line)"
            stroke-width="16"
          />
          <path
            d="M120 104 A46 46 0 0 1 162 172"
            fill="none"
            stroke="var(--color-brand)"
            stroke-width="16"
            stroke-linecap="round"
          />

          <rect
            x="188"
            y="128"
            width="16"
            height="60"
            rx="3"
            class="fill-ink-faint"
          />
          <rect
            x="212"
            y="104"
            width="16"
            height="84"
            rx="3"
            class="fill-brand"
          />
          <rect
            x="236"
            y="144"
            width="16"
            height="44"
            rx="3"
            class="fill-ink-faint"
          />

          <circle
            cx="46"
            cy="150"
            r="15"
            class="fill-satisfaction-high/20"
            stroke="var(--color-satisfaction-high)"
            stroke-width="2"
          />
          <circle
            cx="46"
            cy="150"
            r="6"
            class="fill-satisfaction-high"
          />
        </svg>
      </div>
    </main>

    <div class="flex flex-col gap-3 px-6 pt-10 pb-10">
      <button
        type="button"
        class="bg-kakao text-ink flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold"
        @click="startDemo"
      >
        <IconBrandKakaoTalk :size="20" />
        카카오로 시작하기
      </button>
      <button
        type="button"
        class="border-line bg-surface text-ink flex w-full items-center justify-center gap-2 rounded-2xl border py-3.5 font-semibold"
        @click="startDemo"
      >
        <IconBrandGoogle :size="18" />
        Google로 시작하기
      </button>
      <button
        type="button"
        class="bg-ink text-surface flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold"
        @click="startDemo"
      >
        <IconBrandApple :size="20" />
        Apple로 시작하기
      </button>
      <button
        type="button"
        class="border-line bg-surface text-ink flex w-full items-center justify-center gap-2 rounded-2xl border py-3.5 font-semibold"
        @click="startDemo"
      >
        <IconMail :size="18" />
        이메일로 시작하기
      </button>

      <p class="text-ink-muted mt-2 text-center text-xs leading-relaxed">
        로그인하면 서비스 이용약관 및 개인정보처리방침에<br />
        동의하게 됩니다.
      </p>
    </div>
  </div>
</template>
