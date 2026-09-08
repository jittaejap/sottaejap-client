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

describe('user store', () => {
  beforeEach(() => setActivePinia(createPinia()))

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
})
