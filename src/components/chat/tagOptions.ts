import { COMPANION_TAG, type CompanionTag, type PurposeTag } from '@/api/enums'

/**
 * 표준 태그의 화면 라벨과 전송 값 (#16).
 * 화면에는 label을 그리고, 서버로 보내거나 서버 응답과 비교하는 것은 value 하나뿐이다.
 * 라벨은 읽기 좋으라고 가운뎃점 둘레에 공백을 두지만 정본 표기는 공백이 없다 (01 E-41).
 */
export interface TagOption<V extends string> {
  value: V
  label: string
}

export const PURPOSE_OPTIONS: readonly TagOption<PurposeTag>[] = [
  { value: '식사', label: '식사' },
  { value: '만남·사교', label: '만남 · 사교' },
  { value: '휴식·취미', label: '휴식 · 취미' },
  { value: '필수품', label: '필수품' },
  { value: '자기계발', label: '자기계발' },
  { value: '충동', label: '충동' },
  { value: '기타', label: '기타' },
]

/** 동행인은 한 단어라 라벨과 값이 같다. 나중에 라벨만 바뀌어도 값이 따라가지 않게 같은 형태로 둔다. */
export const COMPANION_OPTIONS: readonly TagOption<CompanionTag>[] = COMPANION_TAG.map((value) => ({
  value,
  label: value,
}))

export function tagLabels(options: readonly TagOption<string>[]): readonly string[] {
  return options.map((option) => option.label)
}

/** 칩에서 고른 라벨을 전송 값으로 되돌린다. 라벨은 같은 목록에서 나오므로 항상 찾는다. */
export function tagValue<V extends string>(options: readonly TagOption<V>[], label: string): V {
  return options.find((option) => option.label === label)!.value
}
