import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/service', () => ({
  getTransactions: vi.fn().mockResolvedValue({
    transactions: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  }),
  uploadTransactions: vi.fn().mockResolvedValue({
    importedCount: 142,
    skippedCount: 1,
    periodFrom: '2026-06-01',
    periodTo: '2026-08-31',
    skippedRows: [{ row: 17, reason: '날짜 형식 오류' }],
  }),
}))

import { ApiError } from '@/api/apiError'
import { getTransactions, uploadTransactions } from '@/api/service'
import TransactionsView from '@/views/TransactionsView.vue'

function mountTransactions() {
  return mount(TransactionsView, {
    global: { stubs: { AppTopBar: true, AppBottomNav: true } },
  })
}

async function openUploadTab(wrapper: ReturnType<typeof mount>) {
  const button = wrapper.findAll('button').find((item) => item.text().trim() === '추가 업로드')
  if (!button) throw new Error('추가 업로드 탭을 찾지 못했다.')
  await button.trigger('click')
}

async function selectFile(wrapper: ReturnType<typeof mount>, file: File) {
  const input = wrapper.get('input[type="file"]')
  Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
  await input.trigger('change')
}

describe('거래내역 추가 업로드', () => {
  it('컴퓨터에서 선택한 파일명과 크기를 첨부 카드에 표시한다', async () => {
    const wrapper = mountTransactions()
    await openUploadTab(wrapper)

    expect(wrapper.text()).not.toContain('2. 파싱 결과 확인')
    expect(wrapper.text()).not.toContain('카드사 선택')

    await selectFile(wrapper, new File([new Uint8Array(2_400_000)], 'my-card-history.xlsx'))

    expect(wrapper.text()).toContain('my-card-history.xlsx')
    expect(wrapper.text()).toContain('2.3 MB')
    expect(wrapper.text()).not.toContain('2. 파싱 결과 확인')

    const uploadButton = wrapper.findAll('button').find((item) => item.text() === '업로드 완료')
    if (!uploadButton) throw new Error('업로드 완료 버튼을 찾지 못했다.')
    await uploadButton.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('2. 파싱 결과 확인')
    expect(wrapper.text()).toContain('142건')
    expect(wrapper.text()).toContain('17행: 날짜 형식 오류')

    await wrapper.get('button[aria-label="파일 제거"]').trigger('click')
    expect(wrapper.text()).not.toContain('my-card-history.xlsx')
    expect(wrapper.text()).not.toContain('2. 파싱 결과 확인')
  })

  it('정본에서 허용한 CSV와 XLSX 외 파일은 첨부하지 않는다', async () => {
    const wrapper = mountTransactions()
    await openUploadTab(wrapper)

    await selectFile(wrapper, new File(['pdf'], 'statement.pdf', { type: 'application/pdf' }))

    expect(wrapper.text()).toContain('CSV 또는 XLSX 파일만 선택할 수 있어요.')
    expect(wrapper.text()).not.toContain('2. 파싱 결과 확인')
  })

  it('400 TOO_MANY_ROWS면 서버 message를 그대로 보여준다 (05 §2 · #24)', async () => {
    const message = '거래내역이 너무 많아요. 20,000건 이하로 나눠서 올려 주세요.'
    vi.mocked(uploadTransactions).mockRejectedValueOnce(new ApiError('TOO_MANY_ROWS', 400, message))
    const wrapper = mountTransactions()
    await openUploadTab(wrapper)
    await selectFile(wrapper, new File(['a,b'], 'too-many.csv'))

    const uploadButton = wrapper.findAll('button').find((item) => item.text() === '업로드 완료')
    if (!uploadButton) throw new Error('업로드 완료 버튼을 찾지 못했다.')
    await uploadButton.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain(message)
    expect(wrapper.text()).not.toContain('거래내역을 업로드하지 못했어요.')
    expect(wrapper.text()).not.toContain('2. 파싱 결과 확인')
  })

  it('다른 오류 코드는 기존 고정 문구를 유지한다', async () => {
    vi.mocked(uploadTransactions).mockRejectedValueOnce(
      new ApiError('INTERNAL_ERROR', 500, '서버 문구'),
    )
    const wrapper = mountTransactions()
    await openUploadTab(wrapper)
    await selectFile(wrapper, new File(['a,b'], 'broken.csv'))

    const uploadButton = wrapper.findAll('button').find((item) => item.text() === '업로드 완료')
    if (!uploadButton) throw new Error('업로드 완료 버튼을 찾지 못했다.')
    await uploadButton.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain(
      '거래내역을 업로드하지 못했어요. 파일을 확인하고 다시 시도해주세요.',
    )
    expect(wrapper.text()).not.toContain('서버 문구')
  })
})

describe('거래내역 조회 API 배선', () => {
  it('기본 요청은 0번 페이지·20건으로 조회한다', async () => {
    const wrapper = mountTransactions()
    await flushPromises()

    expect(vi.mocked(getTransactions).mock.lastCall?.[0]).toMatchObject({ page: 0, size: 20 })
    expect(wrapper.text()).toContain('총 0건')
  })

  it('기간과 회고 필터를 서버 쿼리로 전환한다', async () => {
    vi.setSystemTime(new Date('2026-09-10T03:00:00.000Z'))
    const wrapper = mountTransactions()
    await flushPromises()

    await wrapper.get('button[aria-label="기간 필터"]').trigger('click')
    const sevenDays = wrapper
      .findAll('[role="option"]')
      .find((item) => item.text().trim() === '7일')
    if (!sevenDays) throw new Error('7일 옵션을 찾지 못했다.')
    await sevenDays.trigger('click')
    await flushPromises()
    expect(vi.mocked(getTransactions).mock.lastCall?.[0]).toMatchObject({
      from: '2026-09-04',
      to: '2026-09-10',
      page: 0,
      size: 20,
    })

    await wrapper.get('button[aria-label="회고 필터"]').trigger('click')
    const done = wrapper.findAll('[role="option"]').find((item) => item.text().trim() === '회고함')
    if (!done) throw new Error('회고함 옵션을 찾지 못했다.')
    await done.trigger('click')
    await flushPromises()
    expect(vi.mocked(getTransactions).mock.lastCall?.[0]).toMatchObject({ hasRetrospect: true })
    vi.useRealTimers()
  })
})
