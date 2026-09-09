import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import { routes } from '@/router'
import HomeView from '@/views/HomeView.vue'
import MapView from '@/views/MapView.vue'

vi.mock('@/api/service', () => ({
  getSatisfactionMap: vi.fn().mockRejectedValue(new Error('offline')),
  getGoals: vi.fn().mockResolvedValue([]),
  getMonthlyReport: vi.fn().mockRejectedValue(new Error('offline')),
}))

describe('만족도 지도 이동', () => {
  it('카테고리 카드의 더 보기에서 선택한 카테고리 회고 내역으로 바로 이동한다', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/map')
    await router.isReady()

    const wrapper = mount(MapView, {
      global: {
        plugins: [createPinia(), router],
        stubs: { SatisfactionScatter: true },
      },
    })
    await flushPromises()

    const reviewLink = wrapper.findAll('a').find((link) => link.text().includes('더 보기'))
    if (!reviewLink) throw new Error('더 보기 링크를 찾지 못했습니다.')
    expect(reviewLink.attributes('href')).toBe('/map/behaviors/6/reviews')
  })

  it('홈 행동 변화 카드는 behaviorId path param으로 상세 화면을 연다', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/')
    await router.isReady()
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(HomeView, { global: { plugins: [createPinia(), router] } })

    const behaviorButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('행동 변화'))
    if (!behaviorButton) throw new Error('행동 변화 카드를 찾지 못했습니다.')
    await behaviorButton.trigger('click')

    expect(pushSpy).toHaveBeenCalledWith({
      name: 'behavior-detail',
      params: { behaviorId: 6 },
    })
  })
})
