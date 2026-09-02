/** @type {import('lint-staged').Configuration} */
export default {
  '*.{ts,mts,tsx,vue}': [
    'eslint --fix --cache --max-warnings=0 --no-warn-ignored',
    'prettier --write',
  ],
  '*.{js,mjs,cjs,css,html,json,md,yml,yaml}': 'prettier --write',
}
