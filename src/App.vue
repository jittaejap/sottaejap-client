<script setup lang="ts">
import { RouterView } from 'vue-router'

import AppSplash from '@/components/common/AppSplash.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 진입 가드도 같은 약속을 기다린다(복원은 한 번만 돈다). 여기서 먼저 부르는 이유는 첫 렌더 전에
// `restoring`을 확정하기 위해서다 — 가드는 마이크로태스크 뒤에 돌아서, 기다리기만 하면
// 저장된 토큰이 있어도 빈 화면이 한 번 그려진다. 결과는 가드가 쓰고, 이 약속은 거부되지 않는다.
void userStore.restore()
</script>

<template>
  <div class="mx-auto h-dvh max-w-[390px] overflow-hidden">
    <AppSplash v-if="userStore.restoring" />
    <RouterView
      v-else
      v-slot="{ Component, route }"
    >
      <Transition
        name="page"
        mode="out-in"
      >
        <component
          :is="Component"
          :key="route.path"
        />
      </Transition>
    </RouterView>
  </div>
</template>
