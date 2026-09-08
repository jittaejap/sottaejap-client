// Windows에서는 `eslint`·`prettier`를 이름으로 실행할 수 없다. 확장자 없는 셸 스크립트는
// CreateProcess가 못 찾고(ENOENT), `.cmd` 셔임은 Node 18.20.2+가 shell 없이 실행하기를 거부한다(EINVAL).
// 그래서 실제 실행 파일인 `node`로 각 도구의 엔트리포인트를 직접 돌린다. macOS·Linux도 같은 경로로 동작한다.
const eslint = 'node node_modules/eslint/bin/eslint.js'
const prettier = 'node node_modules/prettier/bin/prettier.cjs'

/** @type {import('lint-staged').Configuration} */
export default {
  '*.{ts,mts,tsx,vue}': [
    `${eslint} --fix --cache --max-warnings=0 --no-warn-ignored`,
    `${prettier} --write`,
  ],
  '*.{js,mjs,cjs,css,html,json,md,yml,yaml}': `${prettier} --write`,
}
