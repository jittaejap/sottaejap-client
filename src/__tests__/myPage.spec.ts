import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import type { UserMe } from '@/api/types'
import femaleProfile from '@/assets/images/profile/female-profile.png'
import maleProfile from '@/assets/images/profile/male-profile.png'
import { routes } from '@/router'
import { useUserStore } from '@/stores/user'
import MyPageView from '@/views/MyPageView.vue'

async function mountMyPage() {
  const pinia = createPinia()
  const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
  await router.push('/me')
  await router.isReady()
  const wrapper = mount(MyPageView, { global: { plugins: [pinia, router] } })
  return { wrapper, store: useUserStore(pinia) }
}

describe('마이페이지 프로필', () => {
  it('성별 데이터가 없으면 여자 프로필을 기본으로 표시한다', async () => {
    const { wrapper } = await mountMyPage()

    expect(wrapper.get('img[alt="예리 프로필"]').attributes('src')).toBe(femaleProfile)
  })

  it('사용자 성별이 남성이면 남자 프로필을 표시하고 이전 UI 값을 유지한다', async () => {
    const { wrapper, store } = await mountMyPage()
    store.me = { gender: 'MALE', name: '민수' } as unknown as UserMe
    await wrapper.vm.$nextTick()

    expect(wrapper.get('img[alt="민수 프로필"]').attributes('src')).toBe(maleProfile)
    expect(wrapper.text()).toContain('목표 달성률')
    expect(wrapper.text()).toContain('월 예산 설정')
    expect(wrapper.text()).toContain('목표 자금 관리')
    expect(wrapper.text()).toContain('소비 분석 민감도')
  })

  it('여성 또는 알 수 없는 성별 값은 여자 프로필을 표시한다', async () => {
    const { wrapper, store } = await mountMyPage()
    store.me = { gender: 'FEMALE', nickname: '예리' } as unknown as UserMe
    await wrapper.vm.$nextTick()
    expect(wrapper.get('img[alt="예리 프로필"]').attributes('src')).toBe(femaleProfile)

    store.me = { gender: 'UNKNOWN', name: '사용자' } as unknown as UserMe
    await wrapper.vm.$nextTick()
    expect(wrapper.get('img[alt="사용자 프로필"]').attributes('src')).toBe(femaleProfile)
  })
})
