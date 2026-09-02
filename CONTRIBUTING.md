# sottaejap-client 협업 가이드

이 문서를 읽으면 브랜치를 만들고, 커밋하고, PR을 올리고, 병합 전 검사를 통과시킬 수
있습니다. 값의 정본은 `myDocs/07_기술스택_레포구성.md` §5·§6·§9입니다. 충돌하면 그쪽이
우선합니다.

## 1. Issue

작업은 Issue를 만든 뒤 시작합니다. `New issue`에서 양식(기능 개발 · 버그 수정 · 리팩터링 · 일반 작업)을
고르면 제목 접두사 `[Feat]` `[Fix]` `[Refactor]` `[Docs]` `[Chore]` `[Test]`가 붙습니다. 한 Issue에는
하나의 목적만 둡니다. 본선 30시간 동안은 Issue 없이 작업해도 됩니다.

## 2. 브랜치

기본 브랜치는 `main`이고 `develop`은 두지 않습니다.

| 브랜치      | 용도                                     |
| ----------- | ---------------------------------------- |
| `main`      | 배포 가능 상태만. 통합 브랜치를 겸합니다 |
| `feature/*` | 기능. 예: `feature/map-scatter`          |
| `fix/*`     | 수정. 예: `fix/login-redirect`           |

이름은 영문 소문자와 하이픈만 씁니다. 본선 30시간 동안은 리뷰 대기로 막히지 않도록
`main` 직접 push를 허용합니다. 그 밖의 기간에는 PR을 거칩니다.

## 3. 커밋

`타입(범위): 한국어 설명` 형식입니다. 범위는 폴더나 화면 이름입니다.

```text
feat(map): 만족도 지도 산점도
fix(api): 401 응답을 ApiError로 정규화
chore(deps): vite 8.2.2로 고정
docs(agents): 방향 규칙 추가
```

| 타입       | 용도                      |
| ---------- | ------------------------- |
| `feat`     | 기능 추가                 |
| `fix`      | 버그 수정                 |
| `refactor` | 동작을 유지하는 구조 개선 |
| `chore`    | 설정, 의존성, 빌드        |
| `test`     | 테스트 추가 또는 수정     |
| `docs`     | 문서만 변경               |

커밋 메시지에 `Co-Authored-By` 트레일러를 넣지 않습니다. 에이전트가 생성한 커밋도 같습니다.

## 4. PR

- 제목은 커밋과 같은 형식입니다.
- 본문에 **무엇을 바꿨는가 · 왜 · 어떻게 검증했는가**를 적습니다. 화면을 바꿨으면 스크린샷을 붙입니다.
- 통합 담당(고현석)이 리뷰한 뒤 병합합니다.
- 관련 없는 변경을 한 PR에 섞지 않습니다.

## 5. 병합 전 검사

CI(`.github/workflows/ci.yml`)가 아래를 같은 순서로 돕니다. 올리기 전에 로컬에서 먼저 통과시킵니다.

```bash
npm run format:check
npm run lint
npm run type-check
npm run test:unit -- --run
npm run build
```

커밋할 때 husky가 lint-staged로 변경 파일의 ESLint와 Prettier를 자동으로 돌립니다.
훅이 Node를 못 찾으면 `.node-version`(24.20.0)이 fnm에 설치되어 있는지 확인합니다.

## 6. 계약 변경 절차

API 경로, DTO, 공유 enum을 바꾸면 세 레포가 같이 깨집니다 (07 §6).

1. `myDocs/05_API_명세서.md`를 **먼저** 고칩니다. 문서가 계약입니다.
2. 팀 채널에 `[계약변경] verdict enum 2종으로` 형태로 한 줄 공지합니다.
3. 클라이언트에서는 `src/api/enums.ts`와 `src/api/types.ts`를 문서에 맞춰 고칩니다.

코드가 문서를 앞서지 않습니다.

## 7. 버전과 도구

`package.json`의 버전은 07 §1 표를 그대로 고정한 값입니다. 임의로 올리지 않습니다.
특히 TypeScript는 `~6.0.3`을 유지합니다. 7.x는 `vue-tsc`와 `typescript-eslint`가
지원하지 않습니다.

의존성을 바꾸면 `package-lock.json`을 같은 커밋에 넣습니다.

## 8. macOS · Windows 혼용

07 §5가 정본입니다. 여기서는 클라이언트에서 실제로 걸리는 것만 적습니다.

- 최초 1회: macOS는 `git config --global core.autocrlf input`, Windows는 `false`.
- `.env`는 터미널로 만듭니다. `cp .env.example .env` / `Copy-Item .env.example .env`.
  Windows 탐색기는 `.env.txt`를 만듭니다.
- 파일·폴더명은 영문 소문자와 하이픈만 씁니다.
- 줄바꿈은 `.gitattributes`가 LF로 강제합니다. diff가 파일 전체로 뜨면 CRLF가 섞인 것입니다.

## 9. 비밀값

`VITE_` 접두사 값은 빌드 산출물에 그대로 들어가 브라우저로 나갑니다. 토큰, 비밀 키,
서버 전용 값을 `.env`에 두지 않습니다. `.env`는 커밋하지 않고 `.env.example`만 커밋합니다.
