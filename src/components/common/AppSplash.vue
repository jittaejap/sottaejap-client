<script setup lang="ts">
import { IconLoader2 } from '@tabler/icons-vue'

// 세션 복원이 `GET /users/me`를 기다리는 동안 대신 보이는 화면 (#34).
// 상한은 `httpClient`의 timeout 20초다(01 E-113) — 서버가 죽어 있으면 그동안 이 화면만 보인다.
// 그래서 정지 화면으로 두지 않고 돌아가는 표시를 둔다.
//
// 로고 이미지(`login/logo.png`)를 쓰지 않는다. 830KB짜리라 `App.vue`가 정적으로 가져오면
// 초기 로드에 들어가는데, precache 대상은 js·css·html뿐이라(vite.config.ts) 새로고침마다
// 네트워크로 받는다. 공백을 메우려는 화면이 스스로 공백을 만든다.
</script>

<template>
  <div class="bg-surface flex h-full w-full flex-col items-center justify-center gap-4">
    <IconLoader2
      :size="32"
      class="text-brand animate-spin motion-reduce:animate-none"
    />
    <p
      role="status"
      class="text-ink-muted text-sm"
    >
      로그인 정보를 확인하고 있어요
    </p>
  </div>
</template>
