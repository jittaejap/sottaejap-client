import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import type { UserMe } from '@/api/types'
import { loginLocal, getCurrentUser } from '@/api/service'
import { routes } from '@/router'
import { useUserStore } from '@/stores/user'
import LoginView from '@/views/LoginView.vue'

vi.mock('@/api/httpClient', () => ({ setAccessToken: vi.fn() }))
vi.mock('@/api/service', () => ({
  loginLocal: vi.fn(),
  loginKakao: vi.fn(),
  getCurrentUser: vi.fn(),
}))

describe('로그인 사용자 상태', () => {
  it('정본에 있는 카카오와 데모 로그인만 노출한다', async () => {
    const pinia = createPinia()
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/login')
    await router.isReady()

    const wrapper = mount(LoginView, { global: { plugins: [pinia, router] } })

    expect(wrapper.findAll('button').map((button) => button.text())).toEqual([
      '카카오로 시작하기',
      '데모 계정으로 시작하기',
    ])
  })

  it('로그인 성공 시 GET /users/me 응답을 store에 저장한 뒤 이동한다', async () => {
    const me: UserMe = {
      id: 1,
      email: 'demo@sottaejap.kr',
      nickname: '데모 사용자',
      authProvider: 'LOCAL',
      monthlyBudget: 2_500_000,
      outlierThreshold: 2,
      retrospectDelayDays: 1,
      onboardingCompleted: true,
      analysisYearMonth: '2026-09',
    }
    vi.mocked(loginLocal).mockResolvedValueOnce({
      accessToken: 'test-token',
      tokenType: 'Bearer',
      expiresAt: '2026-09-09T00:00:00+09:00',
    })
    vi.mocked(getCurrentUser).mockResolvedValueOnce(me)

    const pinia = createPinia()
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/login')
    await router.isReady()
    const replaceSpy = vi.spyOn(router, 'replace')
    const wrapper = mount(LoginView, { global: { plugins: [pinia, router] } })

    const button = wrapper.findAll('button').find((item) => item.text().includes('데모 계정'))
    if (!button) throw new Error('데모 로그인 버튼을 찾지 못했습니다.')
    await button.trigger('click')
    await flushPromises()

    expect(useUserStore(pinia).me).toEqual(me)
    expect(replaceSpy).toHaveBeenCalledWith('/')
  })

  async function demoLoginFrom(loginPath: string, onboardingCompleted = true) {
    vi.mocked(loginLocal).mockResolvedValueOnce({
      accessToken: 'test-token',
      tokenType: 'Bearer',
      expiresAt: '2026-09-09T00:00:00+09:00',
    })
    vi.mocked(getCurrentUser).mockResolvedValueOnce({ onboardingCompleted } as UserMe)

    const pinia = createPinia()
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push(loginPath)
    await router.isReady()
    const replaceSpy = vi.spyOn(router, 'replace')
    const wrapper = mount(LoginView, { global: { plugins: [pinia, router] } })

    const button = wrapper.findAll('button').find((item) => item.text().includes('데모 계정'))
    if (!button) throw new Error('데모 로그인 버튼을 찾지 못했습니다.')
    await button.trigger('click')
    await flushPromises()
    return replaceSpy
  }

  it('로그아웃 상태에서 열었던 경로를 로그인 뒤 그대로 연다 (딥링크)', async () => {
    const replaceSpy = await demoLoginFrom('/login?redirect=%2Fmap%2Fbehaviors%2F7%3Ftab%3Dreviews')
    expect(replaceSpy).toHaveBeenCalledWith('/map/behaviors/7?tab=reviews')
  })

  it('앱 밖으로 나가는 redirect 값은 홈으로 바꾼다', async () => {
    const replaceSpy = await demoLoginFrom('/login?redirect=%2F%2Fevil.example%2Fphish')
    expect(replaceSpy).toHaveBeenCalledWith('/')
  })

  it('온보딩 전 사용자는 딥링크가 있어도 온보딩으로 보낸다', async () => {
    const replaceSpy = await demoLoginFrom('/login?redirect=%2Fmap', false)
    expect(replaceSpy).toHaveBeenCalledWith('/onboarding')
  })
})
