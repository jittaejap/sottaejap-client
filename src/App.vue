<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="mx-auto h-dvh max-w-[390px] overflow-hidden">
    <RouterView v-slot="{ Component, route }">
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
