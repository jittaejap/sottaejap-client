import { describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import { routes } from '@/router'
import OnboardingView from '@/views/OnboardingView.vue'

async function click(wrapper: VueWrapper, label: string) {
  const button = wrapper.findAll('button').find((item) => item.text().trim() === label)
  if (!button) throw new Error('버튼을 찾지 못했습니다: ' + label)
  await button.trigger('click')
}
async function selectUpload(wrapper: VueWrapper) {
  const input = wrapper.get('input[type="file"]')
  const file = new File([new Uint8Array(2_400_000)], 'onboarding-history.xlsx')
  Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
  await input.trigger('change')
}

describe('온보딩 표본 회고', () => {
  it('거래내역 파일을 선택하면 첨부 정보와 파싱 결과를 표시한다', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/onboarding')
    await router.isReady()
    const wrapper = mount(OnboardingView, { global: { plugins: [router] } })

    await click(wrapper, '다음 단계로')

    const nextButton = wrapper
      .findAll('button')
      .find((item) => item.text().trim() === '다음 단계로')
    expect(nextButton?.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).not.toContain('2. 파싱 결과 확인')

    await selectUpload(wrapper)

    expect(wrapper.text()).toContain('onboarding-history.xlsx')
    expect(wrapper.text()).toContain('2.3 MB')
    expect(wrapper.text()).toContain('2. 파싱 결과 확인')
    expect(nextButton?.attributes('disabled')).toBeUndefined()
  })
  it('나중에 회고하기를 누르면 10건 완료 전에도 홈 이동을 요청한다', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/onboarding')
    await router.isReady()
    const wrapper = mount(OnboardingView, { global: { plugins: [router] } })

    await click(wrapper, '다음 단계로')
    await selectUpload(wrapper)
    await click(wrapper, '다음 단계로')
    await click(wrapper, '다음 단계로')

    expect(wrapper.text()).toContain('0 / 10')
    const pushSpy = vi.spyOn(router, 'push')

    await click(wrapper, '나중에 회고하기')

    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  it('거래별 대화를 기록하며 10건 완료 후에만 홈으로 이동한다', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/onboarding')
    await router.isReady()
    const wrapper = mount(OnboardingView, { global: { plugins: [router] } })

    await click(wrapper, '다음 단계로')
    await selectUpload(wrapper)
    await click(wrapper, '다음 단계로')
    await click(wrapper, '다음 단계로')

    expect(wrapper.text()).toContain('0 / 10')
    expect(wrapper.text()).toContain('배달의민족')

    for (let completed = 1; completed <= 10; completed += 1) {
      await click(wrapper, '만족했어요')
      await click(wrapper, '식사')
      await click(wrapper, '혼자')
      await click(wrapper, '네')

      expect(wrapper.text()).toContain(completed + ' / 10')
      expect(router.currentRoute.value.path).toBe('/onboarding')

      if (completed < 10) await click(wrapper, '다음 소비 이어하기')
    }

    expect(wrapper.text()).toContain('홈으로 가기')
    const homeButton = wrapper
      .findAll('button')
      .find((item) => item.text().trim() === '홈으로 가기')
    expect(homeButton?.attributes('disabled')).toBeUndefined()
    expect(router.currentRoute.value.path).toBe('/onboarding')

    const pushSpy = vi.spyOn(router, 'push')
    await click(wrapper, '홈으로 가기')
    expect(pushSpy).toHaveBeenCalledWith('/')
  })
})
