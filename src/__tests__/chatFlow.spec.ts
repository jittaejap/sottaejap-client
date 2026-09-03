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
  const button = wrapper.findAll('button').find((b) => b.text().trim() === label)
  if (!button) throw new Error(`버튼을 찾지 못했다: ${label}\n${wrapper.text().slice(0, 400)}`)
  await button.trigger('click')
}

/** 09 초기 메뉴 → 10 회고 후보 → 12 대화형 회고 → 13 개선 방안 → 14 목표 연결 → 15 요약 */
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

  it('회고를 마치면 개선 방안이 나오고, 줄이는 횟수만큼 절감액이 커진다', async () => {
    const { wrapper } = await mountChat()

    await runRetrospect(wrapper)
    expect(wrapper.text()).toContain('오늘의 개선 방안')
    expect(wrapper.text()).toContain('43,400')

    await click(wrapper, '3회 줄이기월 1회')
    expect(wrapper.text()).toContain('65,100')

    await click(wrapper, '유지월 4회')
    expect(wrapper.text()).toContain('₩0')
  })

  it('목표를 바꾸면 적용 후 달성률이 그 목표 기준으로 다시 계산된다', async () => {
    const { wrapper } = await mountChat()

    await runRetrospect(wrapper)
    await click(wrapper, '목표 자금 연결')

    // 여행 자금: (310,000 + 43,400) / 1,000,000
    expect(wrapper.text()).toContain('35%')

    const emergency = wrapper.findAll('button').find((b) => b.text().includes('비상금'))
    await emergency?.trigger('click')

    // 비상금: (180,000 + 43,400) / 500,000
    expect(wrapper.text()).toContain('45%')
  })

  it('제안을 거절하면 초기 메뉴로 돌아가고 기록은 남는다', async () => {
    const { wrapper } = await mountChat()

    await runRetrospect(wrapper)
    await click(wrapper, '제안 거절하기')

    expect(wrapper.text()).toContain('무엇을 도와드릴까요?')
    expect(wrapper.text()).toContain('제안을 거절할게요')
  })
})
