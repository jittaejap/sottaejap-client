<script setup lang="ts">
import { computed } from 'vue'
import {
  IconBus,
  IconCar,
  IconCoffee,
  IconMoped,
  IconPlane,
  IconShoppingBag,
  IconToolsKitchen2,
} from '@tabler/icons-vue'

const props = withDefaults(defineProps<{ category: string; size?: number }>(), { size: 24 })

const icon = computed(() => {
  if (props.category.includes('배달')) return IconMoped
  if (props.category.includes('카페')) return IconCoffee
  if (props.category.includes('택시')) return IconCar
  if (props.category.includes('교통')) return IconBus
  if (props.category.includes('쇼핑')) return IconShoppingBag
  if (props.category.includes('여행')) return IconPlane
  return IconToolsKitchen2
})
</script>

<template>
  <component
    :is="icon"
    :size="size"
    :stroke-width="1.8"
  />
</template>
