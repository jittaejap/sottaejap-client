import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import MoneyInput from '@/components/common/MoneyInput.vue'

describe('MoneyInput', () => {
  it('금액을 천 단위로 끊어 보여준다', () => {
    const wrapper = mount(MoneyInput, { props: { modelValue: 3_000_000 } })

    expect(wrapper.get('input').element.value).toBe('3,000,000')
  })

  it('0이면 빈 칸으로 두고 지우기 버튼을 감춘다', () => {
    const wrapper = mount(MoneyInput, { props: { modelValue: 0 } })

    expect(wrapper.get('input').element.value).toBe('')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('숫자가 아닌 입력은 버리고 숫자만 emit한다', async () => {
    const wrapper = mount(MoneyInput, { props: { modelValue: 0 } })

    await wrapper.get('input').setValue('₩1,250,000원')

    const emitted = wrapper.emitted('update:modelValue') ?? []
    expect(emitted[emitted.length - 1]).toEqual([1_250_000])
  })

  it('지우기 버튼은 0을 emit한다', async () => {
    const wrapper = mount(MoneyInput, { props: { modelValue: 50_000 } })

    await wrapper.get('button').trigger('click')

    const emitted = wrapper.emitted('update:modelValue') ?? []
    expect(emitted[emitted.length - 1]).toEqual([0])
  })
})
