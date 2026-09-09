import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import { routes } from '@/router'
import MoneyInput from '@/components/common/MoneyInput.vue'
import OnboardingView from '@/views/OnboardingView.vue'
import { ApiError } from '@/api/apiError'
import { saveRetrospect, startOnboarding, uploadTransactions } from '@/api/service'

const { candidates } = vi.hoisted(() => ({
  candidates: Array.from({ length: 10 }, (_, index) => ({
    transactionId: index + 1,
    occurredAt: '2026-07-01T12:00:00+09:00',
    merchant: index === 0 ? '배달의민족' : `가맹점 ${index + 1}`,
    amount: 10_000 + index,
    category: '식사',
    timeSlot: 'DAY',
    reasonCode: 'ONBOARDING_SAMPLE',
    reason: '온보딩 표본',
  })),
}))

vi.mock('@/api/service', () => ({
  createGoal: vi.fn().mockResolvedValue({}),
  uploadTransactions: vi.fn().mockResolvedValue({
    importedCount: 10,
    skippedCount: 0,
    periodFrom: '2026-06-01',
    periodTo: '2026-07-31',
    skippedRows: [],
  }),
  startOnboarding: vi.fn().mockResolvedValue(candidates),
  updateSettings: vi.fn().mockResolvedValue({}),
  saveRetrospect: vi.fn().mockResolvedValue({}),
  completeOnboarding: vi.fn().mockResolvedValue({ onboardingCompleted: true, clusterCount: 1 }),
}))

async function click(wrapper: VueWrapper, label: string) {
  const button = wrapper.findAll('button').find((item) => item.text().trim() === label)
  if (!button) throw new Error('버튼을 찾지 못했습니다: ' + label)
  await button.trigger('click')
  await flushPromises()
}
async function selectUpload(wrapper: VueWrapper) {
  const input = wrapper.get('input[type="file"]')
  const file = new File([new Uint8Array(2_400_000)], 'onboarding-history.xlsx')
  Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
  await input.trigger('change')
}

describe('온보딩 표본 회고', () => {
  it('직접 입력 목표에서만 목표명을 받고 9글자와 허용 문자로 제한한다', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/onboarding')
    await router.isReady()
    const wrapper = mount(OnboardingView, { global: { plugins: [createPinia(), router] } })

    expect(wrapper.find('input[aria-label="목표 이름"]').exists()).toBe(false)
    expect(wrapper.getComponent(MoneyInput).classes()).toContain('border-brand')

    await click(wrapper, '직접 입력')

    const input = wrapper.get('input[aria-label="목표 이름"]')
    expect(input.attributes('maxlength')).toBe('9')
    await input.setValue('여행!@목표123456789')

    expect((input.element as HTMLInputElement).value).toBe('여행목표12345')
    expect(wrapper.text()).toContain('9/9')

    await click(wrapper, '여행')
    expect(wrapper.find('input[aria-label="목표 이름"]').exists()).toBe(false)
  })
  it('거래내역 파일을 선택하면 첨부 정보와 파싱 결과를 표시한다', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/onboarding')
    await router.isReady()
    const wrapper = mount(OnboardingView, { global: { plugins: [createPinia(), router] } })

    await click(wrapper, '다음 단계로')
    await click(wrapper, '다음 단계로')

    const nextButton = wrapper
      .findAll('button')
      .find((item) => item.text().trim() === '다음 단계로')
    expect(nextButton?.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).not.toContain('2. 파싱 결과 확인')

    await selectUpload(wrapper)

    expect(wrapper.text()).toContain('onboarding-history.xlsx')
    expect(wrapper.text()).toContain('2.3 MB')
    expect(wrapper.text()).toContain('onboarding-history.xlsx')
    expect(nextButton?.attributes('disabled')).toBeUndefined()
  })
  it('업로드가 400 TOO_MANY_ROWS면 서버 message를 그대로 보여준다 (05 §2 · #24)', async () => {
    const message = '거래내역이 너무 많아요. 20,000건 이하로 나눠서 올려 주세요.'
    vi.mocked(uploadTransactions).mockRejectedValueOnce(new ApiError('TOO_MANY_ROWS', 400, message))
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/onboarding')
    await router.isReady()
    const wrapper = mount(OnboardingView, { global: { plugins: [createPinia(), router] } })

    await click(wrapper, '다음 단계로')
    await click(wrapper, '다음 단계로')
    await selectUpload(wrapper)
    await click(wrapper, '다음 단계로')

    expect(wrapper.text()).toContain(message)
    expect(wrapper.text()).not.toContain('입력 내용을 저장하지 못했어요.')
    expect(wrapper.text()).not.toContain('0 / 10')
  })
  it('나중에 회고하기를 누르면 완료 API 성공 후 홈 이동을 요청한다', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/onboarding')
    await router.isReady()
    const wrapper = mount(OnboardingView, { global: { plugins: [createPinia(), router] } })

    await click(wrapper, '다음 단계로')
    await click(wrapper, '다음 단계로')
    await selectUpload(wrapper)
    await click(wrapper, '다음 단계로')

    expect(wrapper.text()).toContain('0 / 10')
    const pushSpy = vi.spyOn(router, 'push')

    await click(wrapper, '나중에 회고하기')

    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  it('회고 후보가 없으면 빈 상태를 보여주고 완료할 수 있다', async () => {
    vi.mocked(startOnboarding).mockResolvedValueOnce([])
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/onboarding')
    await router.isReady()
    const wrapper = mount(OnboardingView, { global: { plugins: [createPinia(), router] } })

    await click(wrapper, '다음 단계로')
    await click(wrapper, '다음 단계로')
    await selectUpload(wrapper)
    await click(wrapper, '다음 단계로')

    const pushSpy = vi.spyOn(router, 'push')

    expect(wrapper.text()).toContain('지금 회고할 거래가 없어요')
    expect(wrapper.text()).not.toContain('0 / 0')
    await click(wrapper, '홈으로 가기')
    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  it('거래별 대화를 기록하며 10건 완료 후에만 홈으로 이동한다', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/onboarding')
    await router.isReady()
    const wrapper = mount(OnboardingView, { global: { plugins: [createPinia(), router] } })

    await click(wrapper, '다음 단계로')
    await click(wrapper, '다음 단계로')
    await selectUpload(wrapper)
    await click(wrapper, '다음 단계로')

    expect(wrapper.text()).toContain('0 / 10')
    expect(wrapper.text()).toContain('배달의민족')

    for (let completed = 1; completed <= 10; completed += 1) {
      await click(wrapper, '만족했어요')
      await click(wrapper, '식사')
      await click(wrapper, '혼자')
      await click(wrapper, '네')

      expect(saveRetrospect).toHaveBeenLastCalledWith(
        expect.objectContaining({ source: 'ONBOARDING' }),
      )

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
