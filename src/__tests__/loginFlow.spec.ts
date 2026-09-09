import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

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
      outlierBaseAmount: 100_000,
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
    // 목적지 화면의 lazy import가 테스트 뒤에 끝나면 내려간 jsdom에서 unhandled error가 난다. 호출만 확인한다.
    const replaceSpy = vi.spyOn(router, 'replace').mockResolvedValue(undefined)
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
    const replaceSpy = vi.spyOn(router, 'replace').mockResolvedValue(undefined)
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

  it.each([
    ['//evil.example/phish', '이중 슬래시'],
    ['/\\evil.example', '백슬래시 — 파서가 슬래시로 읽는다'],
    ['/\\/evil.example', '백슬래시와 슬래시'],
    ['/\t/evil.example', '탭 — 파서가 지운다'],
    ['http://[', '파서가 거부하는 값 — 던지면 로그인 자체가 죽는다'],
  ])('앱 밖으로 나가는 redirect 값 %s 은 홈으로 바꾼다 (%s)', async (redirect) => {
    const replaceSpy = await demoLoginFrom(`/login?redirect=${encodeURIComponent(redirect)}`)
    expect(replaceSpy).toHaveBeenCalledWith('/')
  })

  it('온보딩 전 사용자는 딥링크가 있어도 온보딩으로 보낸다', async () => {
    const replaceSpy = await demoLoginFrom('/login?redirect=%2Fmap', false)
    expect(replaceSpy).toHaveBeenCalledWith('/onboarding')
  })
})

describe('카카오 로그인 시작', () => {
  const originalLocation = Object.getOwnPropertyDescriptor(window, 'location')

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    sessionStorage.clear()
    if (originalLocation) Object.defineProperty(window, 'location', originalLocation)
  })

  /** jsdom은 실제 이동을 못 하므로 `assign`만 가로챈다. 나머지 필드는 컴포넌트가 읽는 것만 둔다. */
  function stubLocation() {
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { origin: 'http://localhost:5173', search: '', assign },
    })
    return assign
  }

  async function clickKakaoFrom(loginPath: string) {
    vi.stubEnv('VITE_KAKAO_CLIENT_ID', 'kakao-client-id')
    vi.stubEnv('VITE_KAKAO_REDIRECT_URI', 'http://localhost:5173/auth/callback')
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push(loginPath)
    await router.isReady()
    const wrapper = mount(LoginView, { global: { plugins: [createPinia(), router] } })

    const button = wrapper.findAll('button').find((item) => item.text().includes('카카오'))
    if (!button) throw new Error('카카오 로그인 버튼을 찾지 못했습니다.')
    await button.trigger('click')
    await flushPromises()
    return wrapper
  }

  it('state와 돌아갈 경로를 세션에 남기고 카카오로 이동한다', async () => {
    const assign = stubLocation()

    await clickKakaoFrom('/login?redirect=%2Fmap')

    expect(assign).toHaveBeenCalledTimes(1)
    const authorize = new URL(String(assign.mock.calls[0]?.[0]))
    expect(authorize.origin + authorize.pathname).toBe('https://kauth.kakao.com/oauth/authorize')
    expect(authorize.searchParams.get('state')).toBe(
      sessionStorage.getItem('sottaejap-kakao-oauth-state'),
    )
    expect(sessionStorage.getItem('sottaejap-kakao-oauth-redirect')).toBe('/map')
  })

  it('sessionStorage 쓰기가 던지면 카카오로 넘어가지 않고 화면에 이유를 남긴다', async () => {
    const assign = stubLocation()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })

    const wrapper = await clickKakaoFrom('/login')

    expect(assign).not.toHaveBeenCalled()
    expect(wrapper.find('[role="alert"]').text()).toBe(
      '카카오 로그인 요청을 확인할 수 없어요. 다시 시도해주세요.',
    )
  })
})
