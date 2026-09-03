/** echarts 옵션은 문자열 리터럴로 색을 받으므로, tokens.css 값을 런타임에 읽어 그대로 넘긴다. */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
