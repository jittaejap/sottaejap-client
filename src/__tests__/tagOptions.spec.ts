import { describe, expect, it } from 'vitest'

import { COMPANION_TAG, PURPOSE_TAG, SATISFACTION } from '@/api/enums'
import {
  COMPANION_OPTIONS,
  PURPOSE_OPTIONS,
  SATISFACTION_OPTIONS,
  tagLabels,
  tagValue,
} from '@/components/chat/tagOptions'

describe('표준 태그 라벨·값 (#16)', () => {
  it('전송 값은 표준 태그 7/6종과 순서까지 같다', () => {
    expect(PURPOSE_OPTIONS.map((option) => option.value)).toEqual([...PURPOSE_TAG])
    expect(COMPANION_OPTIONS.map((option) => option.value)).toEqual([...COMPANION_TAG])
    expect(SATISFACTION_OPTIONS.map((option) => option.value)).toEqual([...SATISFACTION])
  })

  it('라벨은 공백만 다르고 가운뎃점은 정본과 같다', () => {
    for (const option of [...PURPOSE_OPTIONS, ...COMPANION_OPTIONS]) {
      expect(option.label.replace(/\s+/g, '')).toBe(option.value)
    }
  })

  it('화면 문구는 가운뎃점 둘레에 공백을 둔 표기 그대로다', () => {
    expect(tagLabels(PURPOSE_OPTIONS)).toEqual([
      '식사',
      '만남 · 사교',
      '휴식 · 취미',
      '필수품',
      '자기계발',
      '충동',
      '기타',
    ])
  })

  it('라벨을 정본 값으로 되돌린다', () => {
    expect(tagValue(PURPOSE_OPTIONS, '휴식 · 취미')).toBe('휴식·취미')
    expect(tagValue(PURPOSE_OPTIONS, '만남 · 사교')).toBe('만남·사교')
    expect(tagValue(COMPANION_OPTIONS, '혼자')).toBe('혼자')
  })

  it('만족도 라벨을 서버 enum으로 되돌린다', () => {
    expect(tagLabels(SATISFACTION_OPTIONS)).toEqual(['만족했어요', '별로예요', '잘 모르겠어요'])
    expect(tagValue(SATISFACTION_OPTIONS, '별로예요')).toBe('LOW')
  })
})
