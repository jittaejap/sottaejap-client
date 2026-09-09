import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia } from 'pinia'

import { routes } from '@/router'
import ChatView from '@/views/ChatView.vue'
import { ApiError } from '@/api/apiError'
import {
  adoptSuggestion,
  chatRetrospect,
  getRetrospectCandidates,
  getSuggestions,
  saveRetrospect,
} from '@/api/service'
import type { RetrospectCandidate, RetrospectChatResult } from '@/api/types'

const CANDIDATE: RetrospectCandidate = {
  transactionId: 1043,
  occurredAt: '2026-09-08T23:10:00+09:00',
  merchant: '배달의민족',
  amount: 23_000,
  category: '배달',
  timeSlot: 'NIGHT',
  reasonCode: 'TIMESLOT_OUTLIER',
  reason: '최근 비슷한 심야 배달이 반복돼 다시 확인해볼 소비로 선정했어요.',
}

const SECOND_CANDIDATE: RetrospectCandidate = {
  transactionId: 1044,
  occurredAt: '2026-09-08T16:45:00+09:00',
  merchant: '스타벅스',
  amount: 6_200,
  category: '카페',
  timeSlot: 'DAY',
  reasonCode: 'THRESHOLD_EXCEEDED',
  reason: '설정한 임계값을 넘은 지출이에요.',
}

/** 05 §2 #11 — `INTRO` 응답. 서버는 다음 단계로 `SATISFACTION`을 준다. */
const INTRO_REPLY: RetrospectChatResult = {
  reply: '지난 밤 11시 배달, 23,000원이었어요. 어떤 마음으로 시키셨나요?',
  step: 'SATISFACTION',
  reflection: { satisfaction: 'UNKNOWN', purpose: null, companion: null, repeatIntent: null },
  needsClarification: false,
  uncertainFields: [],
  fallback: false,
}

vi.mock('@/api/service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/service')>()),
  getSuggestions: vi.fn().mockResolvedValue([]),
  getGoals: vi.fn().mockResolvedValue([]),
  getAnalysis: vi.fn().mockResolvedValue({
    analysisYearMonth: '2026-09',
    byVerdict: [],
    pending: { clusterCount: 0, monthlyTotalAmount: 0, share: 0 },
    byCategory: [],
    highlight: '이번 달 소비 패턴을 분석했어요. 요약해드릴게요.',
  }),
  adoptSuggestion: vi.fn().mockResolvedValue({}),
  rejectSuggestionById: vi.fn().mockResolvedValue({}),
  askFinance: vi.fn().mockResolvedValue({ reply: '금융 Q&A 테스트 답변', fallback: false }),
  getRetrospectCandidates: vi.fn(),
  chatRetrospect: vi.fn(),
  saveRetrospect: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(getRetrospectCandidates).mockReset().mockResolvedValue([CANDIDATE, SECOND_CANDIDATE])
  vi.mocked(chatRetrospect).mockReset().mockResolvedValue(INTRO_REPLY)
  vi.mocked(saveRetrospect).mockReset().mockResolvedValue({})
})

async function mountChat() {
  const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
  await router.push('/chat')
  await router.isReady()
  return { wrapper: mount(ChatView, { global: { plugins: [createPinia(), router] } }), router }
}

async function click(wrapper: VueWrapper, label: string) {
  const button = wrapper
    .findAll('button')
    .find((b) => b.text().trim() === label || b.attributes('aria-label') === label)
  if (!button) throw new Error(`버튼을 찾지 못했다: ${label}\n${wrapper.text().slice(0, 400)}`)
  await button.trigger('click')
  await Promise.resolve()
  await wrapper.vm.$nextTick()
}

async function type(wrapper: VueWrapper, text: string) {
  const input = wrapper.find('input[placeholder="궁금한 내용을 입력해 주세요"]')
  await input.setValue(text)
  await input.trigger('keyup.enter')
  await Promise.resolve()
  await wrapper.vm.$nextTick()
}

/** 09 초기 메뉴 → 10 회고 후보 → 12 대화형 회고 → 13 액션 플랜 → 15 요약 */
async function runRetrospect(wrapper: VueWrapper) {
  await click(wrapper, '회고 등록')
  await click(wrapper, '회고해볼게요')
  await click(wrapper, '만족했어요')
  await click(wrapper, '식사')
  await click(wrapper, '혼자')
  await click(wrapper, '네')
  await click(wrapper, '회고 마무리하기')
}

describe('AI채팅 회고 흐름', () => {
  it('서버 adjustCount를 줄일 횟수로 표시하고 같은 값으로 채택한다', async () => {
    vi.mocked(getSuggestions).mockResolvedValueOnce([
      {
        id: 7,
        behaviorId: 12,
        behaviorName: '심야 배달',
        monthlyTotalAmount: 96_000,
        avgAmount: 12_000,
        txCount: 8,
        adjustedSatisfaction: -0.42,
        quadrant: 'PRIORITY',
        adjustCount: 6,
        expectedSaving: 72_000,
        goalId: null,
        status: 'PROPOSED',
        reason: '횟수를 줄여보세요.',
      },
    ])
    const { wrapper } = await mountChat()
    await runRetrospect(wrapper)

    expect(getSuggestions).toHaveBeenCalledWith('PROPOSED')
    expect(wrapper.text()).toContain('월 8회 → 월 2회')
    expect(wrapper.text()).toContain('월 72,000원')
    await click(wrapper, '제안만 채택하기')
    expect(adoptSuggestion).toHaveBeenCalledWith(7, { adjustCount: 6 })
  })

  it('각 AI 메시지는 대화 시점의 프로필 에셋을 유지한다', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')

    const avatarSources = () => wrapper.findAll('img').map((image) => image.attributes('src') ?? '')

    expect(avatarSources().some((src) => src.includes('07_cheer_hat'))).toBe(true)

    await click(wrapper, '만족했어요')
    await click(wrapper, '식사')
    await click(wrapper, '혼자')
    await click(wrapper, '네')

    expect(avatarSources().some((src) => src.includes('07_cheer_hat'))).toBe(true)
    expect(avatarSources().some((src) => src.includes('05_thinking_hat'))).toBe(true)
    expect(avatarSources().some((src) => src.includes('04_happy_cheeks_hat'))).toBe(true)

    await click(wrapper, '회고 마무리하기')

    expect(avatarSources().some((src) => src.includes('07_cheer_hat'))).toBe(false)
    expect(avatarSources().some((src) => src.includes('05_thinking_hat'))).toBe(false)
    expect(avatarSources().some((src) => src.includes('09_search_hat'))).toBe(true)

    await click(wrapper, '회고 등록')
    expect(avatarSources().some((src) => src.includes('07_cheer_hat'))).toBe(true)
    expect(avatarSources().some((src) => src.includes('05_thinking_hat'))).toBe(true)
  })

  it('초기 메뉴에서 세 가지 기능을 고를 수 있다', async () => {
    const { wrapper } = await mountChat()

    expect(wrapper.text()).toContain('무엇을 도와드릴까요?')
    expect(wrapper.text()).toContain('회고 등록')
    expect(wrapper.text()).toContain('소비 분석')
    expect(wrapper.text()).toContain('금융 지식 Q&A')
  })

  it('초기 메뉴에서 자유 입력 후에도 회고 등록을 시작할 수 있다', async () => {
    const { wrapper } = await mountChat()

    await type(wrapper, '이번 달 배달비가 궁금해요')
    expect(wrapper.text()).toContain('이번 달 배달비가 궁금해요')

    await click(wrapper, '회고 등록')
    expect(wrapper.text()).toContain('회고 후보로 선정된 거래예요')
    expect(wrapper.text()).toContain('회고해볼게요')
  })

  it('질문에 답할 때마다 대화 기록에 질문과 답이 함께 쌓인다', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')
    await click(wrapper, '만족했어요')

    const text = wrapper.text()
    expect(text).toContain('이 소비는 어땠나요?')
    expect(text).toContain('만족했어요')
    expect(text).toContain('이 소비의 목적은 무엇이었나요?')
  })

  it('회고를 마치면 절감액과 목표 영향이 합쳐진 액션 플랜이 나온다', async () => {
    const { wrapper } = await mountChat()

    await runRetrospect(wrapper)
    expect(wrapper.text()).toContain('AI가 분석한 최적의 추천 빈도')
    expect(wrapper.text()).toContain('월 43,400원')
    expect(wrapper.text()).toContain('등록된 목표가 없어 제안만 채택돼요')

    await click(wrapper, '추천 빈도 줄이기')
    expect(wrapper.text()).toContain('월 65,100원')
  })

  it('도움말을 누르면 제안 근거가 펼쳐지고 다시 누르면 접힌다', async () => {
    const { wrapper } = await mountChat()

    await runRetrospect(wrapper)
    expect(wrapper.text()).not.toContain('평균 주문 금액이 늦은 시간대에 더 높아요')

    await click(wrapper, '왜 이 제안이 도움이 될까요?')
    expect(wrapper.text()).toContain('평균 주문 금액이 늦은 시간대에 더 높아요')
    expect(wrapper.text()).toContain('습관적으로 반복되기 쉬워요')
    expect(wrapper.text()).toContain('수면의 질에도 영향을 줘요')

    await click(wrapper, '왜 이 제안이 도움이 될까요?')
    expect(wrapper.text()).not.toContain('평균 주문 금액이 늦은 시간대에 더 높아요')
  })

  it('제안을 거절하면 소비 분석으로 돌아가고 기록은 남는다', async () => {
    const { wrapper } = await mountChat()

    await runRetrospect(wrapper)
    await click(wrapper, '제안 거절하기')

    expect(wrapper.text()).toContain('AI가 분석한 당신의')
    expect(wrapper.text()).toContain('제안을 거절할게요')
  })

  it('회고·소비 분석·금융 Q&A 대화를 채널별로 분리하고 다시 전환해 복원한다', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')
    expect(wrapper.text()).toContain('배달의민족 23,000원 회고할게요')

    await click(wrapper, '소비 분석')
    expect(wrapper.text()).toContain('이번 달 소비 패턴을 분석했어요')
    expect(wrapper.text()).not.toContain('배달의민족 23,000원 회고할게요')

    await click(wrapper, '금융 Q&A')
    await click(wrapper, '예금과 적금의 차이가 뭔가요?')
    expect(wrapper.text()).toContain('예금과 적금의 차이가 뭔가요?')
    expect(wrapper.text()).not.toContain('이번 달 소비 패턴을 분석했어요')

    await click(wrapper, '회고 등록')
    expect(wrapper.text()).toContain('배달의민족 23,000원 회고할게요')
    expect(wrapper.text()).not.toContain('예금과 적금의 차이가 뭔가요?')
  })

  it('회고를 마무리하면 회고 이력은 남기고 소비 분석 채널에서 액션 플랜을 연다', async () => {
    const { wrapper } = await mountChat()

    await runRetrospect(wrapper)
    expect(wrapper.text()).toContain('AI가 분석한 최적의 추천 빈도')
    expect(wrapper.find('button[aria-pressed="true"]').text()).toBe('소비 분석')

    await click(wrapper, '회고 등록')
    expect(wrapper.text()).toContain('회고 마무리하기')
    expect(wrapper.text()).not.toContain('AI가 분석한 최적의 추천 빈도')
  })

  it('소비 분석 결과와 안내 뒤에 후속 질문과 응답을 시간순으로 표시한다', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '소비 분석')
    await type(wrapper, '비상금은 얼마나 모아야 하나요?')

    const text = wrapper.text()
    const introIndex = text.indexOf('이번 달 소비 패턴을 분석했어요')
    const analysisIndex = text.indexOf('AI가 분석한 당신의')
    const guideIndex = text.indexOf('금융에 대해 궁금한 게 있다면')
    const questionIndex = text.indexOf('비상금은 얼마나 모아야 하나요?')
    const replyIndex = text.indexOf('소비 분석에 대한 질문을 확인했어요')

    expect(introIndex).toBeGreaterThanOrEqual(0)
    expect(analysisIndex).toBeGreaterThan(introIndex)
    expect(guideIndex).toBeGreaterThan(analysisIndex)
    expect(questionIndex).toBeGreaterThan(guideIndex)
    expect(replyIndex).toBeGreaterThan(questionIndex)
  })
})

describe('회고 후보 조회 (05 §2 GET /retrospects/candidates)', () => {
  it('오늘 포함 최근 3일 창으로 후보를 부르고 응답을 그대로 보여 준다', async () => {
    vi.setSystemTime(new Date('2026-09-09T01:00:00+09:00'))
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')

    expect(getRetrospectCandidates).toHaveBeenCalledWith(20, {
      from: '2026-09-07',
      to: '2026-09-09',
    })
    expect(wrapper.text()).toContain('배달의민족')
    expect(wrapper.text()).toContain('23,000원')
    expect(wrapper.text()).toContain(CANDIDATE.reason)
    vi.useRealTimers()
  })

  it('브라우저가 KST가 아니어도 3일 창은 KST 달력 날짜다', async () => {
    // UTC 2026-09-08T20:00Z = KST 2026-09-09 05:00
    vi.setSystemTime(new Date('2026-09-08T20:00:00Z'))
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')

    expect(getRetrospectCandidates).toHaveBeenCalledWith(20, {
      from: '2026-09-07',
      to: '2026-09-09',
    })
    vi.useRealTimers()
  })

  it('후보가 0건이면 S10 빈 상태를 안내한다', async () => {
    vi.mocked(getRetrospectCandidates).mockResolvedValue([])
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')

    expect(wrapper.text()).toContain('지금은 돌아볼 거래가 없어요')
    expect(wrapper.text()).toContain('최근 3일 안에는 회고 조건을 채운 거래가 없었어요')
    expect(wrapper.text()).not.toContain('회고해볼게요')
  })

  it('심야 필터는 응답 timeSlot으로 거른다', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    await click(wrapper, '이번 거래는 제외')
    expect(wrapper.text()).toContain('스타벅스')

    await click(wrapper, '심야')
    expect(wrapper.text()).toContain('배달의민족')
    expect(wrapper.text()).not.toContain('스타벅스')
  })

  it('후보 제외는 서버에 저장하지 않는다 (E-49)', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    await click(wrapper, '이번 거래는 제외')

    expect(saveRetrospect).not.toHaveBeenCalled()
    expect(chatRetrospect).not.toHaveBeenCalled()
  })
})

describe('회고 대화 턴 (05 §2 POST /retrospects/chat)', () => {
  it('후보를 고르면 INTRO를 message 없이 한 번 부르고 reply를 첫 발화로 띄운다', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')

    expect(chatRetrospect).toHaveBeenCalledTimes(1)
    const request = vi.mocked(chatRetrospect).mock.calls[0]![0]
    expect(request.transactionId).toBe(1043)
    expect(request.step).toBe('INTRO')
    expect(request).not.toHaveProperty('message')
    expect(request.reflection).toEqual({
      satisfaction: 'UNKNOWN',
      purpose: null,
      companion: null,
      repeatIntent: null,
    })
    expect(wrapper.text()).toContain(INTRO_REPLY.reply)
  })

  it('칩 선택은 서버를 부르지 않고 확정값만 채운다', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')
    vi.mocked(chatRetrospect).mockClear()

    await click(wrapper, '별로예요')
    await click(wrapper, '충동')
    await click(wrapper, '혼자')

    expect(chatRetrospect).not.toHaveBeenCalled()

    await type(wrapper, '앞으로는 줄여보려고요')
    expect(vi.mocked(chatRetrospect).mock.calls[0]![0].reflection).toEqual({
      satisfaction: 'LOW',
      purpose: '충동',
      companion: '혼자',
      repeatIntent: null,
    })
  })

  it('자유 입력은 단계를 함께 실어 보내고 서버가 준 다음 단계를 따른다', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')
    vi.mocked(chatRetrospect).mockResolvedValue({
      reply: '충동적으로 시키신 것 같아요. 누구와 함께였나요?',
      step: 'COMPANION',
      reflection: { satisfaction: 'LOW', purpose: '충동', companion: null, repeatIntent: null },
      needsClarification: true,
      uncertainFields: ['companion'],
      fallback: false,
    })

    await type(wrapper, '그냥 배고파서 혼자 시켰어요')

    expect(vi.mocked(chatRetrospect).mock.calls[1]![0].step).toBe('SATISFACTION')
    expect(wrapper.text()).toContain('충동적으로 시키신 것 같아요')
    // COMPANION → qaCompanion. 동행인 칩이 보인다.
    expect(wrapper.text()).toContain('이 소비는 누구와 함께했나요?')
  })

  it('AI 후보값은 칩을 미리 눌러 둘 뿐 확정값에 실리지 않는다', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')
    vi.mocked(chatRetrospect).mockResolvedValue({
      reply: '별로였던 것 같네요, 맞을까요?',
      step: 'SATISFACTION',
      reflection: { satisfaction: 'LOW', purpose: null, companion: null, repeatIntent: null },
      needsClarification: true,
      uncertainFields: [],
      fallback: false,
    })

    await type(wrapper, '별로였어요')

    const suggested = wrapper
      .findAll('button')
      .find((b) => b.attributes('aria-pressed') === 'true' && b.text().trim() === '별로예요')
    expect(suggested).toBeDefined()

    // 사용자가 확정하기 전에는 요청 reflection이 그대로다.
    await type(wrapper, '음 사실 잘 모르겠어요')
    expect(vi.mocked(chatRetrospect).mock.calls[2]![0].reflection.satisfaction).toBe('UNKNOWN')
  })

  it('recentMessages는 오름차순 6건이고 assistant로 바꾸며 방금 보낸 질문은 뺀다', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')
    await click(wrapper, '별로예요')
    await click(wrapper, '충동')
    await click(wrapper, '혼자')
    vi.mocked(chatRetrospect).mockClear()

    await type(wrapper, '앞으로는 줄여보려고요')

    const sent = vi.mocked(chatRetrospect).mock.calls[0]![0].recentMessages
    expect(sent).toHaveLength(6)
    expect(sent.every((message) => message.role === 'user' || message.role === 'assistant')).toBe(
      true,
    )
    expect(sent.every((message) => message.content.length > 0)).toBe(true)
    // 마지막 원소가 가장 최근 발화다 (E-87).
    expect(sent[sent.length - 1]!.content).toBe('혼자')
    // 방금 보낸 메시지는 이력에 없다.
    expect(sent.some((message) => message.content === '앞으로는 줄여보려고요')).toBe(false)
    // AI 발화는 assistant로 바뀐다.
    expect(sent.some((message) => message.role === 'assistant')).toBe(true)
  })

  it('assistant 내용은 코드 포인트 2,000자로 자른다 (E-110)', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    // 서로게이트 쌍 1자 = 코드 포인트 1 · UTF-16 2
    vi.mocked(chatRetrospect).mockResolvedValue({ ...INTRO_REPLY, reply: '🍜'.repeat(2_500) })
    await click(wrapper, '회고해볼게요')
    vi.mocked(chatRetrospect).mockClear()

    await type(wrapper, '조금 길게 답했네요')

    const sent = vi.mocked(chatRetrospect).mock.calls[0]![0].recentMessages
    const longest = sent.find((message) => message.content.startsWith('🍜'))!
    expect([...longest.content]).toHaveLength(2_000)
  })

  it('message가 500자를 넘으면 서버를 부르지 않는다 (E-112)', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')
    vi.mocked(chatRetrospect).mockClear()

    await type(wrapper, '가'.repeat(501))

    expect(chatRetrospect).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('메시지는 공백 없이 500자 이내로 입력해 주세요')
  })

  it('fallback: true면 S11 템플릿 배너를 띄우고 선택지 모드로 이어간다', async () => {
    const { wrapper } = await mountChat()

    vi.mocked(chatRetrospect).mockResolvedValue({ ...INTRO_REPLY, fallback: true })
    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')

    expect(wrapper.text()).toContain('기본 질문으로 진행하고 있어요')
    expect(wrapper.text()).toContain('이 소비는 어땠나요?')
    expect(wrapper.text()).toContain('만족했어요')
  })

  it('503 LLM_UNAVAILABLE도 같은 배너를 띄우고 흐름을 끊지 않는다', async () => {
    const { wrapper } = await mountChat()

    vi.mocked(chatRetrospect).mockRejectedValue(
      new ApiError('LLM_UNAVAILABLE', 503, 'AI 응답 없음'),
    )
    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')

    expect(wrapper.text()).toContain('기본 질문으로 진행하고 있어요')
    expect(wrapper.text()).toContain('만족했어요')
  })

  it('409 DUPLICATE_RETROSPECT는 안내하고 후보 목록으로 돌아간다', async () => {
    const { wrapper } = await mountChat()

    vi.mocked(chatRetrospect).mockRejectedValue(
      new ApiError('DUPLICATE_RETROSPECT', 409, '이미 회고가 있음'),
    )
    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')

    expect(wrapper.text()).toContain('이미 회고한 거래예요')
    expect(wrapper.text()).toContain('선택한 거래로 회고 시작')
  })
})

describe('회고 저장 (05 §2 POST /retrospects)', () => {
  it('확정한 값을 source CANDIDATE로 저장한다', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')
    await click(wrapper, '별로예요')
    await click(wrapper, '휴식 · 취미')
    await click(wrapper, '친구')
    await click(wrapper, '아니오')
    await click(wrapper, '회고 마무리하기')

    // 라벨이 아니라 정본 표기 value를 보낸다 (#16 · E-99).
    expect(saveRetrospect).toHaveBeenCalledWith({
      transactionId: 1043,
      satisfaction: 'LOW',
      purpose: '휴식·취미',
      companion: '친구',
      repeatIntent: false,
      source: 'CANDIDATE',
    })
  })

  it('저장이 성공한 뒤에만 저장 안내와 분석 채널 전환을 한다', async () => {
    vi.mocked(saveRetrospect).mockRejectedValue(new ApiError('INTERNAL_ERROR', 500, '저장 실패'))
    const { wrapper } = await mountChat()

    await runRetrospect(wrapper)

    expect(wrapper.text()).not.toContain('회고를 저장했어요')
    expect(wrapper.text()).not.toContain('AI가 분석한 최적의 추천 빈도')
    expect(wrapper.text()).toContain('회고를 저장하지 못했어요')
    // 실패해도 마무리 버튼이 남아 다시 시도할 수 있다.
    expect(wrapper.text()).toContain('회고 마무리하기')
  })

  it('409면 안내하고 후보 목록으로 돌아간다', async () => {
    vi.mocked(saveRetrospect).mockRejectedValue(
      new ApiError('DUPLICATE_RETROSPECT', 409, '이미 회고가 있음'),
    )
    const { wrapper } = await mountChat()

    await runRetrospect(wrapper)

    expect(wrapper.text()).toContain('이미 회고한 거래예요')
    expect(wrapper.text()).toContain('선택한 거래로 회고 시작')
    expect(wrapper.text()).not.toContain('회고를 저장했어요')
  })

  it('확정하지 않은 항목이 남으면 저장하지 않고 그 질문으로 되돌아간다', async () => {
    const { wrapper } = await mountChat()

    await click(wrapper, '회고 등록')
    await click(wrapper, '회고해볼게요')
    await click(wrapper, '만족했어요')
    // 목적만 고르고 서버가 CONFIRM으로 건너뛴 경우
    await click(wrapper, '식사')
    vi.mocked(chatRetrospect).mockResolvedValue({
      reply: '정리해볼게요.',
      step: 'CONFIRM',
      reflection: { satisfaction: 'HIGH', purpose: '식사', companion: null, repeatIntent: null },
      needsClarification: false,
      uncertainFields: [],
      fallback: false,
    })
    await type(wrapper, '이제 마무리할게요')
    await click(wrapper, '회고 마무리하기')

    expect(saveRetrospect).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('저장하기 전에 남은 질문 하나만 확인할게요')
    expect(wrapper.text()).toContain('이 소비는 누구와 함께했나요?')
  })
})
