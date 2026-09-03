# sottaejap-client

소때잡의 Vue 3 PWA 클라이언트입니다. 이 문서를 읽으면 로컬에서 앱을 띄우고 검사 명령을 돌릴 수 있습니다.

## 시작하기

Node 24.20.0을 씁니다 (`.node-version`). 설치는 `sottaejap-docs/07_기술스택_레포구성.md` §5-4를 따릅니다.

```bash
cp .env.example .env        # Windows: Copy-Item .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

`VITE_API_BASE_URL`은 `sottaejap-server`(:8080)를 가리킵니다.

## 검사 명령

CI가 같은 순서로 돕니다.

```bash
npm run format:check
npm run lint
npm run type-check
npm run test:unit -- --run
npm run build
```

## 구조

```
src/
├── api/          axios 인스턴스 · 공유 enum · 엔드포인트별 함수 (05 문서 1:1)
├── assets/       styles/tokens.css — 디자인 토큰의 유일한 정의 위치
├── components/   common · chat · map
├── composables/
├── router/       03 IA 번호 체계와 1:1
├── stores/       Pinia
└── views/        화면 8개
```

의존 방향은 `views → components · composables · stores → api`입니다. 규칙은 [AGENTS.md](./AGENTS.md)를 보세요.

## 배포

Vercel 정적 빌드입니다. SPA 라우팅 rewrite는 `vercel.json`에 있습니다.
