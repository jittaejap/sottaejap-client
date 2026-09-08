import { describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import type { UserMe } from '@/api/types'
import router, { entryRedirect } from '@/router'
import { useUserStore } from '@/stores/user'

const 로그인전 = { signedIn: false, onboardingCompleted: false }
const 온보딩전 = { signedIn: true, onboardingCompleted: false }
const 완료 = { signedIn: true, onboardingCompleted: true }

describe('FR-09-03 진입 분기', () => {
  it('로그인 전에는 어느 화면을 열어도 1L 로그인으로 보낸다', () => {
    expect(entryRedirect({ name: 'home' }, 로그인전)).toEqual({ name: 'login' })
    expect(entryRedirect({ name: 'map' }, 로그인전)).toEqual({ name: 'login' })
    expect(entryRedirect({ name: 'me' }, 로그인전)).toEqual({ name: 'login' })
    expect(entryRedirect({ name: 'budget-settings' }, 로그인전)).toEqual({ name: 'login' })
  })

  it('로그인 화면 자체는 막지 않는다 — 막으면 무한 이동이 된다', () => {
    expect(entryRedirect({ name: 'login' }, 로그인전)).toBeNull()
  })

  it('카카오 콜백은 로그인 전에도 열어 준다 — 막으면 code를 버리게 된다', () => {
    expect(entryRedirect({ name: 'auth-callback' }, 로그인전)).toBeNull()
  })

  it('로그인했지만 온보딩 전이면 2-1 온보딩으로 보낸다', () => {
    expect(entryRedirect({ name: 'home' }, 온보딩전)).toEqual({ name: 'onboarding' })
    expect(entryRedirect({ name: 'transactions' }, 온보딩전)).toEqual({ name: 'onboarding' })
  })

  it('온보딩 화면에서는 다시 온보딩으로 보내지 않는다', () => {
    expect(entryRedirect({ name: 'onboarding' }, 온보딩전)).toBeNull()
  })

  it('온보딩까지 마치면 원래 가려던 화면을 그대로 연다', () => {
    expect(entryRedirect({ name: 'home' }, 완료)).toBeNull()
    expect(entryRedirect({ name: 'transactions' }, 완료)).toBeNull()
    expect(entryRedirect({ name: 'behavior-detail' }, 완료)).toBeNull()
  })

  it('이미 로그인한 사람이 로그인 화면을 열면 진행 상태에 맞는 곳으로 돌려보낸다', () => {
    expect(entryRedirect({ name: 'login' }, 온보딩전)).toEqual({ name: 'onboarding' })
    expect(entryRedirect({ name: 'login' }, 완료)).toEqual({ name: 'home' })
  })
})

describe('라우터에 가드가 실제로 붙어 있다', () => {
  it('로그인 전에 /me로 들어가면 /login으로 바뀐다', async () => {
    setActivePinia(createPinia())

    await router.push('/me')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('로그인하고 온보딩까지 마치면 /me가 그대로 열린다', async () => {
    setActivePinia(createPinia())
    const store = useUserStore()
    store.accessToken = 'test-token'
    store.me = { onboardingCompleted: true } as UserMe

    await router.push('/me')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/me')
  })
})
