import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from 'eslint-config-prettier/flat'
import { designTokensPlugin } from './eslint-rules/design-tokens.mjs'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', 'eslint-rules/**/*.d.mts']),

  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommendedTypeChecked,

  {
    name: 'app/project-rules',
    rules: {
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/define-macros-order': 'error',
      'vue/html-button-has-type': 'error',
    },
  },

  {
    // 색은 src/assets/styles/tokens.css의 토큰만 쓴다. 원시 HEX와 Tailwind arbitrary 색상을 막는다.
    name: 'app/design-token-rules',
    files: ['src/**/*.{ts,tsx,vue}'],
    ignores: ['src/**/__tests__/**', 'src/**/*.{test,spec}.{ts,tsx}'],
    plugins: {
      'design-tokens': designTokensPlugin,
    },
    rules: {
      'design-tokens/no-raw-colors': 'error',
    },
  },

  {
    ...pluginVitest.configs.recommended,
    name: 'app/vitest-rules',
    files: ['src/**/__tests__/**/*.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
  },

  skipFormatting,
)
