import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

vi.mock('@/api/service', () => ({ getCurrentUser: vi.fn() }))

import { getCurrentUser } from '@/api/service'
import App from '@/App.vue'
import AppSplash from '@/components/common/AppSplash.vue'
import { useUserStore } from '@/stores/user'

const storageKey = 'sottaejap-access-token'

/**
 * 실제 라우터를 쓰면 목적지 화면의 lazy import가 테스트가 끝난 뒤 완료되고, 내려간 jsdom에서
 * vue-router가 `history`를 읽어 unhandled error가 난다(#9 PR #29에서 드러난 플레이크).
 * 여기서 볼 것은 `App.vue`의 스플래시 분기뿐이라, 바로 해석되는 화면 하나만 둔 라우터를 쓴다.
 * 이 라우터에는 진입 가드가 없으므로 복원이 끝나지 않아도 준비 상태가 된다 —
 * 그래서 "복원 중에는 화면 대신 스플래시"를 라우터 준비 여부와 섞이지 않게 확인할 수 있다.
 */
async function mountApp() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<p>화면</p>' } }],
  })
  const wrapper = mount(App, { global: { plugins: [pinia, router] } })
  await router.isReady()
  await wrapper.vm.$nextTick()
  return { wrapper, store: useUserStore(pinia) }
}

describe('세션 복원 중 스플래시', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.mocked(getCurrentUser).mockReset()
  })

  it('저장된 토큰이 있으면 GET /users/me 응답 전에 화면 대신 스플래시를 보여 준다', async () => {
    sessionStorage.setItem(storageKey, 'saved')
    // 응답이 오지 않는 상태를 흉내 낸다. 상한 20초 동안 사용자가 보는 화면이다 (01 E-113).
    vi.mocked(getCurrentUser).mockReturnValue(new Promise(() => {}))

    const { wrapper, store } = await mountApp()

    expect(store.restoring).toBe(true)
    expect(wrapper.findComponent(AppSplash).exists()).toBe(true)
    expect(wrapper.text()).toContain('로그인 정보를 확인하고 있어요')
    expect(wrapper.text()).not.toContain('화면')
  })

  it('복원이 끝나면 스플래시를 걷고 진입 가드가 정한 화면을 보여 준다', async () => {
    sessionStorage.setItem(storageKey, 'saved')
    vi.mocked(getCurrentUser).mockResolvedValue({ onboardingCompleted: true } as never)

    const { wrapper, store } = await mountApp()
    await store.restore()
    await wrapper.vm.$nextTick()

    expect(store.restoring).toBe(false)
    expect(store.signedIn).toBe(true)
    expect(wrapper.findComponent(AppSplash).exists()).toBe(false)
    expect(wrapper.text()).toContain('화면')
  })

  it('저장된 토큰이 유효하지 않아도 스플래시를 걷는다 — 1L 로그인으로 떨어진다', async () => {
    sessionStorage.setItem(storageKey, 'expired')
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('UNAUTHORIZED'))

    const { wrapper, store } = await mountApp()
    await store.restore()
    await wrapper.vm.$nextTick()

    expect(store.restoring).toBe(false)
    expect(store.signedIn).toBe(false)
    expect(wrapper.findComponent(AppSplash).exists()).toBe(false)
  })

  it('저장된 토큰이 없으면 스플래시를 한 번도 그리지 않는다', async () => {
    const { wrapper, store } = await mountApp()

    expect(store.restoring).toBe(false)
    expect(wrapper.findComponent(AppSplash).exists()).toBe(false)
    expect(wrapper.text()).toContain('화면')
    expect(getCurrentUser).not.toHaveBeenCalled()
  })
})
