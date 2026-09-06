import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import { routes } from '@/router'
import ChatView from '@/views/ChatView.vue'

async function mountChat() {
  const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
  await router.push('/chat')
  await router.isReady()
  return { wrapper: mount(ChatView, { global: { plugins: [router] } }), router }
}

async function click(wrapper: VueWrapper, label: string) {
  const button = wrapper
    .findAll('button')
    .find((b) => b.text().trim() === label || b.attributes('aria-label') === label)
  if (!button) throw new Error(`버튼을 찾지 못했다: ${label}\n${wrapper.text().slice(0, 400)}`)
  await button.trigger('click')
}

/** 09 초기 메뉴 → 10 회고 후보 → 12 대화형 회고 → 13 액션 플랜 → 15 요약 */
async function runRetrospect(wrapper: VueWrapper) {
  await click(wrapper, '회고 등록')
  await click(wrapper, '회고해볼게요')
  await click(wrapper, '만족했어요')
  await click(wrapper, '식사')
  await click(wrapper, '혼자')
  await click(wrapper, '네')
  await click(wrapper, '회고 마무리하기')
}

describe('AI채팅 회고 흐름', () => {
  it('각 AI 메시지는 대화 시점의 프로필 에셋을 유지한다', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')

    const avatarSources = () => wrapper.findAll('img').map((image) => image.attributes('src') ?? '')

    expect(avatarSources().some((src) => src.includes('07_cheer_hat'))).toBe(true)

    await click(wrapper, '만족했어요')
    await click(wrapper, '식사')
    await click(wrapper, '혼자')
    await click(wrapper, '네')

    expect(avatarSources().some((src) => src.includes('07_cheer_hat'))).toBe(true)
    expect(avatarSources().some((src) => src.includes('05_thinking_hat'))).toBe(true)
    expect(avatarSources().some((src) => src.includes('04_happy_cheeks_hat'))).toBe(true)

    await click(wrapper, '회고 마무리하기')

    expect(avatarSources().some((src) => src.includes('07_cheer_hat'))).toBe(true)
    expect(avatarSources().some((src) => src.includes('05_thinking_hat'))).toBe(true)
    expect(avatarSources().some((src) => src.includes('09_search_hat'))).toBe(true)
  })
  it('초기 메뉴에서 세 가지 기능을 고를 수 있다', async () => {
    const { wrapper } = await mountChat()

    expect(wrapper.text()).toContain('무엇을 도와드릴까요?')
    expect(wrapper.text()).toContain('회고 등록')
    expect(wrapper.text()).toContain('소비 분석')
    expect(wrapper.text()).toContain('금융 지식 Q&A')
  })

  it('질문에 답할 때마다 대화 기록에 질문과 답이 함께 쌓인다', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')
    await click(wrapper, '만족했어요')

    const text = wrapper.text()
    expect(text).toContain('이 소비는 어땠나요?')
    expect(text).toContain('만족했어요')
    expect(text).toContain('이 소비의 목적은 무엇이었나요?')
  })

  it('회고를 마치면 절감액과 목표 영향이 합쳐진 액션 플랜이 나온다', async () => {
    const { wrapper } = await mountChat()

    await runRetrospect(wrapper)
    expect(wrapper.text()).toContain('AI가 분석한 최적의 추천 빈도')
    expect(wrapper.text()).toContain('월 43,400원')
    expect(wrapper.text()).toContain('여행 자금 달성률')
    expect(wrapper.text()).toContain('35%')

    await click(wrapper, '추천 빈도 줄이기')
    expect(wrapper.text()).toContain('월 65,100원')
    expect(wrapper.text()).toContain('38%')
  })

  it('도움말을 누르면 제안 근거가 펼쳐지고 다시 누르면 접힌다', async () => {
    const { wrapper } = await mountChat()

    await runRetrospect(wrapper)
    expect(wrapper.text()).not.toContain('평균 주문 금액이 늦은 시간대에 더 높아요')

    await click(wrapper, '왜 이 제안이 도움이 될까요?')
    expect(wrapper.text()).toContain('평균 주문 금액이 늦은 시간대에 더 높아요')
    expect(wrapper.text()).toContain('습관적으로 반복되기 쉬워요')
    expect(wrapper.text()).toContain('수면의 질에도 영향을 줘요')

    await click(wrapper, '왜 이 제안이 도움이 될까요?')
    expect(wrapper.text()).not.toContain('평균 주문 금액이 늦은 시간대에 더 높아요')
  })

  it('제안을 거절하면 초기 메뉴로 돌아가고 기록은 남는다', async () => {
    const { wrapper } = await mountChat()

    await runRetrospect(wrapper)
    await click(wrapper, '제안 거절하기')

    expect(wrapper.text()).toContain('무엇을 도와드릴까요?')
    expect(wrapper.text()).toContain('제안을 거절할게요')
  })
})
