import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/service', () => ({
  uploadTransactions: vi.fn().mockResolvedValue({
    importedCount: 142,
    skippedCount: 1,
    periodFrom: '2026-06-01',
    periodTo: '2026-08-31',
    skippedRows: [{ row: 17, reason: '날짜 형식 오류' }],
  }),
}))

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
})
