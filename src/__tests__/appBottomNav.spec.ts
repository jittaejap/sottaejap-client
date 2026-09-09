import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'

import AppBottomNav from '@/components/common/AppBottomNav.vue'
import { routes } from '@/router'

describe('하단 탭', () => {
  it('IA 3-1~3-4의 네 탭 이름과 경로를 사용한다', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(AppBottomNav, { global: { plugins: [router] } })
    const links = wrapper.findAll('a')

    expect(links.map((link) => link.text())).toEqual(['홈', '채팅', '지도', '거래내역'])
    expect(links.map((link) => link.attributes('href'))).toEqual([
      '/',
      '/chat',
      '/map',
      '/transactions',
    ])
  })
})
