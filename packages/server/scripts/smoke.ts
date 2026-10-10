/** 로컬 수색 화면 검증용. 임시 DB·서명 키만 쓰고 운영 DB에는 연결하지 않는다. */
import { readFileSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath, URL as NodeURL } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import * as schema from '@worldsea/shared/db/main';
import { createApp } from '../src/app';
import { keySetVerifier } from '../src/auth';
import type { Db } from '../src/db';
import type { Env } from '../src/env';

const apiUrl = 'http://127.0.0.1:8790';
const clientUrl = 'http://127.0.0.1:5174';
const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'smoke@example.test', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: new Date().toISOString() };
const pg = new PGlite();
await pg.exec(`create schema auth; create table auth.users (id uuid primary key, email varchar);
  create role anon; create role authenticated; create role service_role;`);
const migrations = new NodeURL('../../shared/migrations/main/', import.meta.url);
for (const name of readdirSync(migrations).filter((n) => n.endsWith('.sql')).sort()) {
  for (const statement of readFileSync(new NodeURL(name, migrations), 'utf8').split('--> statement-breakpoint')) if (statement.trim()) await pg.exec(statement);
}
await pg.query('insert into auth.users(id) values ($1)', [user.id]);
const db = drizzle(pg, { schema }) as unknown as Db;
await db.insert(schema.players).values({ id: user.id, nickname: '테스트대장', stamina: 60, timeTickets: 3, gold: 1000, premium: 20 });
const [hunter] = await db.insert(schema.hunters).values({ ownerId: user.id, name: '헌터 1' }).returning();
await db.insert(schema.regions).values([
  { id: 'asia_fresh', nameKo: '아시아 민물', kind: 'freshwater', unlockStage: 1, requiredLevel: 1, huntSeconds: 5, huntStaminaCost: 2, specialMapChance: 0 },
  { id: 'central_america_fresh', nameKo: '중미 민물', kind: 'freshwater', unlockStage: 1, requiredLevel: 1, huntSeconds: 5, huntStaminaCost: 1, sortOrder: 1, specialMapChance: 0 },
  { id: 'devonian', nameKo: '데본기', kind: 'ancient', unlockStage: 4, requiredLevel: 35, requiresTimeTicket: true, huntSeconds: 1800, huntStaminaCost: 5, sortOrder: 2 },
]);
// 로컬 화면에서 바로 수령을 확인할 예시. 실제 지역 시간·DB에는 영향을 주지 않는다.
await db.insert(schema.species).values({ id: 'betta_splendens', nameKo: '베타', scientificName: 'Betta splendens', regionId: 'asia_fresh', rarity: 'common', tempMin: 24, tempMax: 28, salinity: 'fresh', maxSizeCm: 7, basePrice: 100, initialPopulation: 100 });
await db.insert(schema.wildPopulations).values({ speciesId: 'betta_splendens', count: 98 });
await db.insert(schema.items).values({ id: 'float_common', nameKo: '일반 찌', kind: 'float', grade: 'common', chanceBonus: 0.05 });
const demoAt = new Date(Date.now() - 10_000);
const [demo] = await db.insert(schema.expeditions).values({
  playerId: user.id, hunterId: hunter!.id, regionId: 'asia_fresh', status: 'completed',
  startedAt: new Date(demoAt.getTime() - 10_000), endsAt: demoAt, staminaCost: 2, repeatTotal: 2, repeatDone: 2,
  result: { catches: [{ speciesId: 'betta_splendens', count: 2 }], gold: 40, premium: 1, exp: 20, items: [{ id: 'float_common', count: 3 }], misses: 0 },
}).returning();
await db.insert(schema.fish).values(['male', 'female'].map((sex) => ({
  ownerId: user.id, speciesId: 'betta_splendens', origin: 'wild' as const, sex: sex as 'male' | 'female',
  genotype: {}, morphKey: 'wild', sizeCm: 5, health: 95, growthRate: 1, maturity: 1,
  expeditionId: demo!.id, pendingClaim: true, caughtRegionId: 'asia_fresh', bornAt: demoAt, statsUpdatedAt: demoAt,
})));
const { publicKey, privateKey } = await generateKeyPair('ES256');
const keys = createLocalJWKSet({ keys: [{ ...await exportJWK(publicKey), kid: 'smoke', alg: 'ES256' }] });
const token = await new SignJWT({ role: 'authenticated', email: user.email }).setProtectedHeader({ alg: 'ES256', kid: 'smoke' })
  .setSubject(user.id).setAudience('authenticated').setIssuer(`${apiUrl}/auth/v1`).setIssuedAt().setExpirationTime('1h').sign(privateKey);
const app = createApp({ db: () => ({ db, close: async () => {} }), verifier: () => keySetVerifier(keys, { audience: 'authenticated', issuer: `${apiUrl}/auth/v1` }) });

const server = createServer(async (req, res) => {
  try {
    if (req.url === '/__smoke/login') {
      res.writeHead(302, { Location: `${clientUrl}/#access_token=${token}&refresh_token=smoke-only&expires_in=3600&token_type=bearer&type=magiclink` });
      res.end();
      return;
    }
    if (req.url === '/auth/v1/user') {
      res.writeHead(req.method === 'OPTIONS' ? 204 : 200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': clientUrl, 'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info,x-supabase-api-version' });
      res.end(req.method === 'OPTIONS' ? undefined : JSON.stringify(user));
      return;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) if (value) headers.set(name, Array.isArray(value) ? value.join(',') : value);
    const response = await app.fetch(new Request(`${apiUrl}${req.url}`, {
      method: req.method, headers, ...(chunks.length ? { body: Buffer.concat(chunks).toString('utf8') } : {}),
    }), {} as Env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) { console.error(e); res.writeHead(500); res.end('테스트 서버 오류'); }
});
await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(8790, '127.0.0.1', resolve); });
const clientDir = fileURLToPath(new NodeURL('../../client/', import.meta.url));
const vite = spawn(process.execPath, [fileURLToPath(new NodeURL('../../client/node_modules/vite/bin/vite.js', import.meta.url)), '--host', '127.0.0.1', '--port', '5174', '--strictPort'], {
  cwd: clientDir, stdio: 'inherit', windowsHide: true,
  env: { ...process.env, VITE_API_URL: apiUrl, VITE_SUPABASE_URL: apiUrl, VITE_SUPABASE_PUBLISHABLE_KEY: 'smoke-publishable-key' },
});
console.log(`로컬 테스트 로그인: ${apiUrl}/__smoke/login (종료하면 테스트 데이터가 사라집니다)`);
const stop = () => { vite.kill(); server.close(); void pg.close(); };
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
vite.once('exit', () => { server.close(); void pg.close(); });
