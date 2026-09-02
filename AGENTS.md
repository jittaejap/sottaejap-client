# AGENTS.md

이 저장소에서 코딩 에이전트(Claude Code · Codex)가 먼저 읽는 파일입니다. **규칙의 본문은
여기에 두지 않고 정본 문서를 가리킵니다.** 같은 규칙이 두 곳에 있으면 반드시 어긋나기
때문입니다. 여기에는 **모르면 반드시 틀리는 전제**만 적습니다.

## 정본 문서

| 알고 싶은 것                | 문서                                             |
| --------------------------- | ------------------------------------------------ |
| 모든 결정의 출처            | `myDocs/01_결정로그.md` (충돌 시 이 문서가 우선) |
| 화면·IA 번호                | `myDocs/03_IA_화면정의서.md`                     |
| API 경로·DTO·enum·오류 코드 | `myDocs/05_API_명세서.md`                        |
| 스택 버전·폴더 구조·OS 규칙 | `myDocs/07_기술스택_레포구성.md`                 |
| 브랜치·커밋·PR·검사 명령    | [CONTRIBUTING.md](./CONTRIBUTING.md)             |
| 설치와 실행                 | [README.md](./README.md)                         |

`myDocs/`는 팀 공유 폴더에 있고 이 저장소 밖입니다. 없으면 팀원에게 요청합니다.

## 고정된 것 — 임의로 올리지 않는다

Node `24.20.0` · npm · TypeScript `~6.0.3` · Vue Router `5.x` · Pinia `4.x`

- 버전은 07 §1 표와 `package.json`에 고정돼 있습니다. 로컬에서 다른 Node가 잡히면
  도구가 원인 불명으로 실패하므로, 코드를 의심하기 전에 `node -v`부터 확인합니다.
- **TypeScript 7.x를 설치하지 않습니다.** JS API가 없어 `vue-tsc`와 `typescript-eslint`가 멈춥니다.
- pnpm·yarn을 쓰지 않습니다. 잠금 파일은 `package-lock.json` 하나입니다.

## 작업 전에 반드시 확인할 것

- 커밋 메시지에 `Co-Authored-By` 트레일러를 넣지 않습니다.
- API·enum·DTO를 바꾸는 작업이면 **05 문서가 먼저 바뀌었는지** 확인합니다. 문서에 없는
  필드를 코드에서 지어내지 않습니다. 없으면 만들지 말고 사용자에게 묻습니다.
- 화면을 추가하는 작업이면 03 문서에 IA 번호가 있는지 확인합니다.
- 정보가 충돌하면 조용히 한쪽을 고르지 말고 **충돌 자체를 보고**합니다.

## 구조 — 07 §2 평면 구조, 방향은 한 줄

```
views → components · composables · stores → api
```

- `api/`는 위 계층을 모릅니다. `stores/`는 뷰나 컴포넌트를 import하지 않습니다.
- 라우트는 `src/router/index.ts`가 03 IA 번호와 1:1로 소유합니다.

## 모든 요청은 `src/api/httpClient.ts`로

- `{ success, data }` 봉투 해제와 `ApiError(code, status)` 정규화를 인터셉터가 끝냅니다.
  호출부에서 봉투를 다시 풀거나 재시도를 만들지 않습니다.
- 오류 분기는 메시지가 아니라 `error.code`로 합니다. 코드 목록은 05 §0입니다.
- 공유 enum은 `src/api/enums.ts`에서만 가져옵니다. `'HIGH'` 같은 문자열을 코드에 직접 쓰지 않습니다.
- 서버 시각은 ISO 8601 오프셋 문자열(`+09:00`)입니다. 숫자 배열로 오면 서버 버그이니
  파싱으로 덮지 말고 보고합니다.

## 스타일 — 토큰만 쓴다

- 색은 `src/assets/styles/tokens.css`의 토큰에서 생성된 Tailwind 클래스만 씁니다.
- 컴포넌트에 HEX를 쓰지 않습니다. `bg-[#aaa]` 같은 arbitrary 색상도 같습니다. ESLint
  `design-tokens/no-raw-colors`가 막습니다. 규칙을 끄지 말고 토큰을 추가합니다.
- 팔레트가 바뀌면 `tokens.css`만 바꿉니다. 현재 값은 피그마 확정 전 임시값입니다.

## 만족도 지도 (07 §8)

- `evaluationStatus === 'PENDING'`이면 회색 반투명 점, 배지 없음. `quadrant`·`verdict`는 null입니다.
- 아니면 색 = `verdict` 2색(`SUSTAIN` / `ADJUST`). 처방 문구(Great!/Hmm!)를 색상에 쓰지 않습니다.
- 정렬은 `ADJUST` 먼저, 그 안에서 `burdenRatio` 내림차순. `stores/map.ts`의 `sortedPoints`가 이미 합니다.

## PWA 캐시 경계

앱 셸과 js/css/html만 precache합니다. 인증·거래·회고·API 응답은 runtime cache에 넣지
않습니다. `vite.config.ts`의 `workbox.runtimeCaching`은 비어 있어야 합니다.

## OS 혼용 (07 §5)

- 파일·폴더명은 영문 소문자와 하이픈만. 한글 파일명은 macOS NFD 문제로 금지합니다.
- `.env`는 터미널로 만듭니다. `.env.example`만 커밋합니다.
- 줄바꿈은 `.gitattributes`가 LF로 강제합니다.

## 완료 보고

작업을 끝내면 **바꾼 것 · 지킨 계약 · 실행한 검사와 결과 · 실행하지 못한 검증과 이유 ·
남은 위험**을 구분해 적습니다. "성공"으로 뭉뚱그리지 않습니다. CI 통과와 로컬 통과를 구분합니다.
