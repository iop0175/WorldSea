import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiError, ApiErrorCode } from '@worldsea/shared';

/** 처리 중 던지면 공통 오류 응답으로 바뀐다 */
export class HttpError extends Error {
  constructor(public status: ContentfulStatusCode, public code: ApiErrorCode, message: string) {
    super(message);
  }
}

export const errorBody = (code: ApiErrorCode, message: string): ApiError => ({ error: { code, message } });

export function sendError(c: Context, err: unknown) {
  if (err instanceof HttpError) return c.json(errorBody(err.code, err.message), err.status);
  console.error(err);
  return c.json(errorBody('internal', '서버 오류가 발생했습니다'), 500);
}
