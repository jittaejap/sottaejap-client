<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconCalendarEvent, IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'open-change': [value: boolean]
}>()

function startOfDay(value = new Date()) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function parseIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null
}

function toIso(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplay(value: string) {
  return value.replace(/-/g, '.')
}

const today = startOfDay()
const initialDate = parseIso(props.modelValue) ?? today
const displayedMonth = ref(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))
const open = ref(false)
const draft = ref(formatDisplay(props.modelValue))
const error = ref('')
const weekdays = ['일', '월', '화', '수', '목', '금', '토']

watch(
  () => props.modelValue,
  (value) => {
    draft.value = formatDisplay(value)
    const date = parseIso(value)
    if (date) displayedMonth.value = new Date(date.getFullYear(), date.getMonth(), 1)
  },
)

const calendarDays = computed(() => {
  const year = displayedMonth.value.getFullYear()
  const month = displayedMonth.value.getMonth()
  const leading = new Date(year, month, 1).getDay()
  const count = new Date(year, month + 1, 0).getDate()
  return [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: count }, (_, index) => index + 1),
  ]
})

const monthLabel = computed(
  () => `${displayedMonth.value.getFullYear()}년 ${displayedMonth.value.getMonth() + 1}월`,
)

function toggleCalendar() {
  open.value = !open.value
  emit('open-change', open.value)
}

function moveMonth(offset: number) {
  displayedMonth.value = new Date(
    displayedMonth.value.getFullYear(),
    displayedMonth.value.getMonth() + offset,
    1,
  )
}

function dateFor(day: number) {
  return new Date(displayedMonth.value.getFullYear(), displayedMonth.value.getMonth(), day)
}

function isDisabled(day: number) {
  return dateFor(day) <= today
}

function isToday(day: number) {
  return dateFor(day).getTime() === today.getTime()
}

function isSelected(day: number) {
  return toIso(dateFor(day)) === props.modelValue
}

function selectDay(day: number) {
  if (isDisabled(day)) return
  error.value = ''
  emit('update:modelValue', toIso(dateFor(day)))
}

function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '').slice(0, 8)
  const parts = [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean)
  draft.value = parts.join('.')
  input.value = draft.value
  error.value = ''

  if (digits.length !== 8) return
  const candidate = parseIso(`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`)
  if (!candidate || candidate <= today) {
    error.value = '오늘 이후 날짜를 입력해 주세요.'
    return
  }
  emit('update:modelValue', toIso(candidate))
}

function restoreValue() {
  if (error.value || draft.value.length !== 10) {
    draft.value = formatDisplay(props.modelValue)
    error.value = ''
  }
}
</script>

<template>
  <div class="space-y-2">
    <div class="border-brand flex h-[52px] items-center rounded-xl border px-4">
      <input
        :value="draft"
        type="text"
        inputmode="numeric"
        maxlength="10"
        aria-label="목표 달성 예정일"
        placeholder="YYYY.MM.DD"
        class="text-ink placeholder:text-ink-faint min-w-0 flex-1 text-lg font-bold outline-none placeholder:text-sm placeholder:font-normal"
        @input="onInput"
        @blur="restoreValue"
      />
      <button
        type="button"
        class="text-brand flex size-8 items-center justify-center"
        :aria-expanded="open"
        aria-label="달력 열기"
        @click="toggleCalendar"
      >
        <IconCalendarEvent :size="20" />
      </button>
    </div>

    <p
      v-if="error"
      class="text-brand text-[11px]"
    >
      {{ error }}
    </p>

    <div
      v-if="open"
      class="border-line bg-surface rounded-2xl border p-3 shadow-sm"
    >
      <div class="mb-3 flex items-center justify-center gap-4">
        <button
          type="button"
          class="text-ink-muted flex size-7 items-center justify-center"
          aria-label="이전 달"
          @click="moveMonth(-1)"
        >
          <IconChevronLeft :size="17" />
        </button>
        <strong class="text-ink min-w-24 text-center text-sm">{{ monthLabel }}</strong>
        <button
          type="button"
          class="text-ink-muted flex size-7 items-center justify-center"
          aria-label="다음 달"
          @click="moveMonth(1)"
        >
          <IconChevronRight :size="17" />
        </button>
      </div>

      <div class="grid grid-cols-7 text-center">
        <span
          v-for="(weekday, index) in weekdays"
          :key="weekday"
          class="py-1 text-[10px] font-semibold"
          :class="
            index === 0 ? 'text-brand' : index === 6 ? 'text-preview-blue-ink' : 'text-ink-faint'
          "
        >
          {{ weekday }}
        </span>
        <span
          v-for="(day, index) in calendarDays"
          :key="`${monthLabel}-${index}`"
          class="flex h-8 items-center justify-center"
        >
          <button
            v-if="day"
            type="button"
            class="flex size-7 items-center justify-center rounded-full text-xs"
            :class="
              isSelected(day)
                ? 'bg-brand text-surface font-bold'
                : isToday(day)
                  ? 'bg-brand-soft text-ink opacity-100'
                  : isDisabled(day)
                    ? 'text-ink-faint opacity-35'
                    : index % 7 === 0
                      ? 'text-brand'
                      : index % 7 === 6
                        ? 'text-preview-blue-ink'
                        : 'text-ink'
            "
            :disabled="isDisabled(day)"
            :aria-current="isToday(day) ? 'date' : undefined"
            :aria-label="`${displayedMonth.getMonth() + 1}월 ${day}일`"
            @click="selectDay(day)"
          >
            {{ day }}
          </button>
        </span>
      </div>
    </div>
  </div>
</template>
