// iOS Safari는 iOS 10부터 뷰포트 메타의 maximum-scale·user-scalable을 접근성 사유로 "사용자
// 제스처"에 한해 무시한다. 그래서 핀치 확대를 실제로 끄는 스위치는 WebKit 전용 gesture 이벤트뿐이다.
// 이 이벤트는 손가락 두 개의 확대·회전에서만 발생하므로 한 손가락 스크롤·탭에는 영향이 없다.
export function lockZoomGestures() {
  // 배열에 as const를 붙이지 않는다 — type이 string이어야 비표준 이벤트명이 addEventListener
  // 오버로드를 통과한다. gesture 이벤트는 passive 기본값 대상(touch·wheel)이 아니라
  // `{ passive: false }`가 동작을 바꾸지는 않지만, 의도를 못 박아 두려고 명시한다.
  // gesturestart만 막아도 대개 멈추지만 iOS 버전에 따라 제스처 도중·종료에 배율이 남는 사례가
  // 있어 셋 다 건다.
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, (event) => event.preventDefault(), { passive: false })
  }
}
