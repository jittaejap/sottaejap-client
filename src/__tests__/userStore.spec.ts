import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/service', () => ({ getCurrentUser: vi.fn() }))

import { getCurrentUser } from '@/api/service'
import { httpClient } from '@/api/httpClient'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'

type RequestConfig = { headers: Record<string, string> }
type RequestHandler = { fulfilled: (config: RequestConfig) => Promise<RequestConfig> }

/** setAccessToken이 모듈 사설 변수라 요청 인터셉터를 직접 태워서 확인한다. */
async function authHeader() {
  const { handlers } = httpClient.interceptors.request as unknown as { handlers: RequestHandler[] }
  const [interceptor] = handlers
  if (!interceptor) throw new Error('요청 인터셉터가 등록되지 않았습니다.')
  const config = await interceptor.fulfilled({ headers: {} })
  return config.headers.Authorization
}

const storageKey = 'sottaejap-access-token'

describe('user store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
    vi.mocked(getCurrentUser).mockReset()
  })

  it('로그아웃하면 다음 요청에 Authorization이 실리지 않는다', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ onboardingCompleted: true } as never)
    const store = useUserStore()
    await store.signIn('tok')
    expect(await authHeader()).toBe('Bearer tok')

    store.signOut()
    expect(await authHeader()).toBeUndefined()
  })

  it('로그아웃하면 채팅 세션을 초기화해 다음 계정에 이전 대화가 노출되지 않는다', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ onboardingCompleted: true } as never)
    const userStore = useUserStore()
    const chatStore = useChatStore()

    await userStore.signIn('first-user-token')
    chatStore.activate('qna')
    chatStore.steps.retrospect = 'qaPurpose'
    chatStore.steps.analysis = 'analysis'
    chatStore.steps.qna = 'qna'
    chatStore.addMessage('retrospect', { role: 'user', text: '첫 번째 사용자의 회고' })
    chatStore.addMessage('analysis', { role: 'ai', text: '첫 번째 사용자의 분석' })
    chatStore.addMessage('qna', { role: 'user', text: '첫 번째 사용자의 금융 질문' })

    userStore.signOut()

    expect(chatStore.activeMode).toBe('retrospect')
    expect(chatStore.steps).toEqual({ retrospect: 'menu', analysis: 'menu', qna: 'menu' })
    expect(chatStore.histories.retrospect).toEqual([])
    expect(chatStore.histories.analysis).toEqual([])
    expect(chatStore.histories.qna).toEqual([])

    await userStore.signIn('second-user-token')
    expect(chatStore.histories.retrospect).toEqual([])
    expect(chatStore.histories.analysis).toEqual([])
    expect(chatStore.histories.qna).toEqual([])
  })

  it('사용자 조회가 실패하면 토큰까지 되돌린다', async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('boom'))
    const store = useUserStore()

    await expect(store.signIn('tok')).rejects.toThrow('boom')
    expect(store.signedIn).toBe(false)
    expect(await authHeader()).toBeUndefined()
  })

  it('온보딩 완료를 반영하면 진입 분기가 홈을 연다', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ onboardingCompleted: false } as never)
    const store = useUserStore()
    await store.signIn('tok')
    expect(store.onboardingCompleted).toBe(false)

    store.markOnboardingCompleted()
    expect(store.onboardingCompleted).toBe(true)
  })

  it('로그인하면 토큰을 sessionStorage에 남기고, 로그아웃하면 지운다', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ onboardingCompleted: true } as never)
    const store = useUserStore()

    await store.signIn('tok')
    expect(sessionStorage.getItem(storageKey)).toBe('tok')

    store.signOut()
    expect(sessionStorage.getItem(storageKey)).toBeNull()
  })

  it('사용자 조회가 실패하면 sessionStorage의 토큰도 지운다', async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('boom'))
    const store = useUserStore()

    await expect(store.signIn('tok')).rejects.toThrow('boom')
    expect(sessionStorage.getItem(storageKey)).toBeNull()
  })
})

describe('user store — 새로고침 뒤 복원', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
    vi.mocked(getCurrentUser).mockReset()
  })

  it('저장된 토큰이 없으면 아무것도 하지 않는다', async () => {
    const store = useUserStore()
    await store.restore()

    expect(store.signedIn).toBe(false)
    expect(getCurrentUser).not.toHaveBeenCalled()
  })

  it('저장된 토큰으로 GET /users/me까지 마쳐 온보딩 완료 여부를 되살린다', async () => {
    sessionStorage.setItem(storageKey, 'saved')
    vi.mocked(getCurrentUser).mockResolvedValue({ onboardingCompleted: true } as never)
    const store = useUserStore()

    await store.restore()

    expect(store.signedIn).toBe(true)
    expect(store.onboardingCompleted).toBe(true)
    expect(await authHeader()).toBe('Bearer saved')
  })

  it('저장된 토큰이 유효하지 않으면 조용히 로그아웃 상태로 떨어진다', async () => {
    sessionStorage.setItem(storageKey, 'expired')
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('UNAUTHORIZED'))
    const store = useUserStore()

    await expect(store.restore()).resolves.toBeUndefined()

    expect(store.signedIn).toBe(false)
    expect(sessionStorage.getItem(storageKey)).toBeNull()
    expect(await authHeader()).toBeUndefined()
  })

  it('sessionStorage 접근이 던져도 복원은 거부되지 않는다 — 거부가 캐시되면 모든 내비게이션이 막힌다', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })
    const store = useUserStore()

    await expect(store.restore()).resolves.toBeUndefined()
    expect(store.signedIn).toBe(false)

    getItem.mockRestore()
  })

  it('sessionStorage 쓰기가 던져도 로그인은 성공한다 — 세션이 안 남을 뿐이다', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })
    vi.mocked(getCurrentUser).mockResolvedValue({ onboardingCompleted: true } as never)
    const store = useUserStore()

    await expect(store.signIn('tok')).resolves.toBeUndefined()
    expect(store.signedIn).toBe(true)
    expect(await authHeader()).toBe('Bearer tok')

    setItem.mockRestore()
  })

  it('여러 번 불러도 사용자 조회는 한 번만 한다', async () => {
    sessionStorage.setItem(storageKey, 'saved')
    vi.mocked(getCurrentUser).mockResolvedValue({ onboardingCompleted: true } as never)
    const store = useUserStore()

    await Promise.all([store.restore(), store.restore()])
    await store.restore()

    expect(getCurrentUser).toHaveBeenCalledTimes(1)
  })
})
