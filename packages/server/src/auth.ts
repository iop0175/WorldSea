import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';
import { HttpError } from './errors';
import type { Env } from './env';

/** 검증된 로그인 사용자 */
export interface AuthUser {
  id: string; // Supabase auth.users.id (= players.id)
  email?: string;
}

export type TokenVerifier = (token: string) => Promise<AuthUser>;

const jwksCache = new Map<string, JWTVerifyGetKey>();

/**
 * Supabase Auth 액세스 토큰 검증기.
 * - SUPABASE_JWT_SECRET 이 있으면 예전 방식(HS256 공유 비밀)
 * - 없으면 SUPABASE_URL 의 JWKS(비대칭 서명 키, 새 프로젝트 기본)
 * 클라이언트가 보낸 사용자 id는 믿지 않고 토큰의 sub 만 쓴다.
 */
export function supabaseVerifier(env: Env): TokenVerifier {
  const audience = 'authenticated';
  if (env.SUPABASE_JWT_SECRET) {
    const key = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
    return (token) => verifyWith(token, (t) => jwtVerify(t, key, { audience, algorithms: ['HS256'] }));
  }
  if (!env.SUPABASE_URL) throw new Error('SUPABASE_URL 또는 SUPABASE_JWT_SECRET 이 필요합니다');
  const base = env.SUPABASE_URL.replace(/\/$/, '');
  const issuer = `${base}/auth/v1`;
  let jwks = jwksCache.get(base);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
    jwksCache.set(base, jwks);
  }
  return keySetVerifier(jwks, { audience, issuer });
}

/** JWKS(키 묶음)로 검증. 테스트에서는 로컬 키 묶음을 넣는다 */
export function keySetVerifier(keys: JWTVerifyGetKey, opts: { audience: string; issuer?: string }): TokenVerifier {
  return (token) => verifyWith(token, (t) => jwtVerify(t, keys, opts));
}

async function verifyWith(token: string, verify: (t: string) => Promise<{ payload: JWTPayload }>): Promise<AuthUser> {
  try {
    const { payload } = await verify(token);
    if (!payload.sub) throw new Error('sub 없음');
    return { id: payload.sub, email: typeof payload.email === 'string' ? payload.email : undefined };
  } catch {
    throw new HttpError(401, 'unauthorized', '로그인이 필요하거나 만료되었습니다');
  }
}

/** Authorization: Bearer <토큰> */
export function bearerToken(header: string | undefined): string | null {
  const m = header?.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
