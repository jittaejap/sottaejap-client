import { describe, expect, it } from 'vitest'

import { routes } from '@/router'

describe('router', () => {
  it('기본 경로와 마이페이지 설정 경로를 가진다', () => {
    expect(routes.map((r) => r.path)).toEqual([
      '/login',
      '/auth/callback',
      '/onboarding',
      '/',
      '/chat',
      '/map',
      '/map/behaviors/:behaviorId',
      '/map/behaviors/:behaviorId/reviews',
      '/transactions',
      '/me',
      '/me/budget',
      '/me/goals',
      '/me/analysis-settings',
      '/notifications',
    ])
  })
})
