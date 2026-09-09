import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

vi.mock('@/api/service', () => ({ getCurrentUser: vi.fn() }))

import App from '@/App.vue'
import AppBottomNav from '@/components/common/AppBottomNav.vue'

/**
 * jsdom에는 레이아웃이 없어 실제 높이(px)나 안전영역 여백을 잴 수 없다. 여기서 회귀로 막는 것은
 * "셸 루트가 브라우저 UI에 따라 값이 변하는 높이 단위로 되돌아가는 것"뿐이고, 밀림이 실제로
 * 사라졌는지는 실기기 확인 몫이다.
 *
 * 라우터는 `appSplash.spec.ts`와 같은 이유로 바로 해석되는 화면 하나만 둔다 — 실제 라우터를 쓰면
 * lazy import가 테스트가 끝난 뒤 완료되면서 내려간 jsdom에서 unhandled error가 난다.
 */
function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<p>화면</p>' } }],
  })
}

describe('앱 셸 높이', () => {
  it('루트는 브라우저 UI에 따라 변하지 않는 뷰포트 높이를 쓴다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = makeRouter()
    const wrapper = mount(App, { global: { plugins: [pinia, router] } })
    await router.isReady()

    // 100dvh는 주소창이 접히고 펴질 때마다 값이 변해 헤더·탭바를 밀어 올린다.
    const root = wrapper.get('div').classes()
    expect(root).toContain('h-svh')
    expect(root).not.toContain('h-dvh')
    // 문서 쪽 스크롤 잠금(index.css)은 셸이 뷰포트를 넘지 않는다는 전제 위에 서 있다.
    expect(root).toEqual(expect.arrayContaining(['overflow-hidden', 'max-w-[390px]', 'mx-auto']))
  })

  it('하단 탭바는 홈 인디케이터 영역을 비워 둔다', () => {
    const wrapper = mount(AppBottomNav, { global: { plugins: [makeRouter()] } })

    expect(wrapper.get('nav').classes()).toContain('pb-[env(safe-area-inset-bottom)]')
  })
})
