<script setup lang="ts">
import defaultAvatar from '@/assets/images/ai/02_wave_small_hat.png'

withDefaults(
  defineProps<{
    role?: 'ai' | 'user'
    avatar?: string
    userSolid?: boolean
  }>(),
  { role: 'ai', avatar: defaultAvatar, userSolid: false },
)
</script>

<template>
  <div
    class="flex items-end gap-2"
    :class="role === 'user' ? 'flex-row-reverse' : ''"
  >
    <span
      v-if="role === 'ai'"
      class="bg-brand-soft flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full"
    >
      <img
        :src="avatar"
        alt=""
        class="size-[45px] object-contain"
      />
    </span>
    <div
      class="max-w-[260px] rounded-2xl px-3 py-3 text-[13px] leading-[1.4]"
      :class="
        role === 'user'
          ? userSolid
            ? 'bg-brand text-surface rounded-tr-sm'
            : 'bg-brand-soft text-brand rounded-tr-sm font-semibold'
          : 'bg-progress-track text-ink rounded-tl-sm font-medium'
      "
    >
      <slot />
    </div>
    <span class="text-ink-faint shrink-0 text-[10px]">09:41</span>
  </div>
</template>
