/** 05 §0 오류 응답 `{ success: false, error: { code, message } }`를 정규화한 예외. 분기는 `code`로 한다. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
