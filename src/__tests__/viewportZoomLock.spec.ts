import { describe, expect, it } from 'vitest'

// 빌드 산출물이 아니라 실제 진입 HTML을 그대로 읽는다 (Vite `?raw`).
import indexHtml from '../../index.html?raw'
import mainSource from '../main.ts?raw'
import { lockZoomGestures } from '@/utils/zoomLock'

describe('뷰포트 메타 확대 상한', () => {
  it('확대 배율을 1배로 고정한다', () => {
    const viewport = /<meta\s+name="viewport"\s+content="([^"]+)"/.exec(indexHtml)?.[1]

    // iOS의 포커스 자동 확대(입력창 font-size 16px 미만)를 막는 실제 스위치는 maximum-scale이다.
    // 지우면 채팅 입력창을 누를 때 다시 확대된다.
    expect(viewport).toContain('maximum-scale=1.0')
    expect(viewport).toContain('user-scalable=no')
    // 기존 계약도 함께 유지되어야 한다 — 기본 폭과 노치 대응.
    expect(viewport).toContain('width=device-width')
    expect(viewport).toContain('initial-scale=1.0')
    expect(viewport).toContain('viewport-fit=cover')
  })
})

describe('핀치 확대 제스처 차단', () => {
  function dispatch(type: string) {
    const event = new Event(type, { cancelable: true })
    document.dispatchEvent(event)
    return event
  }

  it('확대·회전 제스처 3종을 모두 막는다', () => {
    lockZoomGestures()

    // 셋 다 막혀야 한다 — iOS 버전에 따라 gesturestart만 막으면 제스처 도중·종료에 배율이 남는다.
    const gestures = ['gesturestart', 'gesturechange', 'gestureend']

    expect(gestures.filter((type) => dispatch(type).defaultPrevented)).toEqual(gestures)
  })

  it('앱이 부팅할 때 실제로 걸린다', () => {
    // 이 스펙이 lockZoomGestures를 직접 부르므로, main.ts의 호출이 지워져도 위 단언은 통과한다.
    // 차단이 조용히 사라지는 것을 막으려면 배선 자체를 여기서 잠가야 한다.
    expect(mainSource).toMatch(/^lockZoomGestures\(\)$/m)
  })

  it('한 손가락 스크롤·탭은 그대로 둔다', () => {
    const touches = ['touchstart', 'touchmove', 'touchend', 'click']

    expect(touches.filter((type) => dispatch(type).defaultPrevented)).toEqual([])
  })
})
