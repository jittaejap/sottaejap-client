import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import NumberUnitInput from '@/components/common/NumberUnitInput.vue'

describe('NumberUnitInput', () => {
  it('숫자 입력과 고정 단위를 분리해서 보여준다', async () => {
    const wrapper = mount(NumberUnitInput, { props: { modelValue: 12, unit: '개월' } })

    expect(wrapper.get('input').element.value).toBe('12')
    expect(wrapper.text()).toContain('개월')

    await wrapper.get('input').setValue('24개월')
    expect(wrapper.emitted('update:modelValue')).toContainEqual([24])
  })
})
