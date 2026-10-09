import type { ApiError, ApiErrorCode, HealthResponse, MeResponse, RegionsResponse, StartExpeditionBody, StartExpeditionResponse } from '@worldsea/shared';
import { accessToken } from './auth/supabase';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8787';

export class ApiRequestError extends Error {
  constructor(public status: number, public code: ApiErrorCode | 'network', message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
    });
  } catch {
    throw new ApiRequestError(0, 'network', '서버에 연결할 수 없습니다');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(res.status, body?.error.code ?? 'internal', body?.error.message ?? `요청 실패 (${res.status})`);
  }
  return (await res.json()) as T;
}

export const fetchHealth = (signal?: AbortSignal) => request<HealthResponse>('/health', { signal });
export const getMe = () => request<MeResponse>('/v1/me');
export const createPlayer = (nickname: string) => request<MeResponse>('/v1/players', { method: 'POST', body: JSON.stringify({ nickname }) });
export const getRegions = () => request<RegionsResponse>('/v1/regions');
export const startExpedition = (body: StartExpeditionBody, key: string) => request<StartExpeditionResponse>('/v1/expeditions', {
  method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(body),
});

/** 실시간 채널 주소 (토큰은 쿼리로: 브라우저 WebSocket은 헤더를 못 붙임) */
export async function realtimeUrl(): Promise<string | null> {
  const token = await accessToken();
  if (!token) return null;
  return `${API_URL.replace(/^http/, 'ws')}/ws?token=${encodeURIComponent(token)}`;
}
