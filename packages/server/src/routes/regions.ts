import { Hono, type Context } from 'hono';
import { asc, eq } from 'drizzle-orm';
import type { RegionDetailResponse, RegionsResponse, RegionView } from '@worldsea/shared';
import { players, regions, species, wildPopulations } from '@worldsea/shared/db/main';
import type { AppEnv } from '../app';
import { HttpError } from '../errors';

export const regionRoutes = new Hono<AppEnv>();

function toRegionView(
  region: typeof regions.$inferSelect,
  player: Pick<typeof players.$inferSelect, 'level'>,
): RegionView {
  return {
    id: region.id,
    nameKo: region.nameKo,
    kind: region.kind,
    unlockStage: region.unlockStage,
    requiredLevel: region.requiredLevel,
    requiresTimeTicket: region.requiresTimeTicket,
    specialMapChance: region.specialMapChance,
    huntSeconds: region.huntSeconds,
    huntStaminaCost: region.huntStaminaCost,
    // 지역은 레벨로만 열린다. unlockStage는 월드 개방 단계(민물→해역→고대)이지 샵 단계가 아니다.
    // 고대 지역의 시간 티켓은 수색 시작 때 검사한다.
    unlocked: player.level >= region.requiredLevel,
  };
}

/** 초기 개체수 대비 현재 비율(%, 정수). 방류로 100을 넘을 수 있다 */
export function populationPercent(count: number, initial: number): number {
  if (initial <= 0) return 0;
  return Math.round((count / initial) * 100);
}

async function requirePlayer(c: Context<AppEnv>) {
  const [player] = await c.var.db
    .select({ level: players.level })
    .from(players)
    .where(eq(players.id, c.var.user.id));

  if (!player) throw new HttpError(404, 'needs_signup', '닉네임을 정하고 시작해 주세요');
  return player;
}

regionRoutes.get('/regions', async (c) => {
  const player = await requirePlayer(c);
  const rows = await c.var.db.select().from(regions).orderBy(asc(regions.sortOrder), asc(regions.id));
  return c.json<RegionsResponse>({
    serverTime: new Date().toISOString(),
    regions: rows.map((region) => toRegionView(region, player)),
  });
});

regionRoutes.get('/regions/:id', async (c) => {
  const player = await requirePlayer(c);
  const [region] = await c.var.db.select().from(regions).where(eq(regions.id, c.req.param('id')));
  if (!region) throw new HttpError(404, 'not_found', '지역을 찾을 수 없습니다');

  const rows = await c.var.db
    .select({
      id: species.id,
      nameKo: species.nameKo,
      scientificName: species.scientificName,
      rarity: species.rarity,
      isOriginal: species.isOriginal,
      isSpecialMapOnly: species.isSpecialMapOnly,
      breedable: species.breedable,
      auctionable: species.auctionable,
      initialPopulation: species.initialPopulation,
      populationCount: wildPopulations.count,
      conservationStatus: wildPopulations.status,
    })
    .from(species)
    .leftJoin(wildPopulations, eq(wildPopulations.speciesId, species.id))
    .where(eq(species.regionId, region.id))
    .orderBy(asc(species.nameKo));

  return c.json<RegionDetailResponse>({
    serverTime: new Date().toISOString(),
    region: toRegionView(region, player),
    species: rows.map((row) => ({
      id: row.id,
      nameKo: row.nameKo,
      scientificName: row.scientificName,
      rarity: row.rarity,
      isOriginal: row.isOriginal,
      isSpecialMapOnly: row.isSpecialMapOnly,
      breedable: row.breedable,
      auctionable: row.auctionable,
      // 정확한 개체수·예약분·숨은 보유량은 내보내지 않는다 (마지막 몇 마리 노리기 방지). 초기 대비 비율과 상태만.
      conservation:
        row.populationCount === null || row.conservationStatus === null
          ? null
          : { percent: populationPercent(row.populationCount, row.initialPopulation), status: row.conservationStatus },
    })),
  });
});
