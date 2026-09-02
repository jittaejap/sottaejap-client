import { describe, expect, it } from 'vitest'

import { routes } from '@/router'

describe('router', () => {
  it('07 §2 표의 경로 8개를 그대로 가진다', () => {
    expect(routes.map((r) => r.path)).toEqual([
      '/login',
      '/onboarding',
      '/',
      '/chat',
      '/map',
      '/transactions',
      '/me',
      '/notifications',
    ])
  })
})
