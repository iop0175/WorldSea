import { and, asc, eq, inArray, lte } from 'drizzle-orm';
import {
  computeStamina, gameDay, hasExpeditionRewards, morphKey, needsMinigame, phenotype, RARE_BITE_TIMEOUT_SEC,
  rarityAtLeast, releaseReward, staminaRegenSec, statusFromPercent,
  vulnerableDailyLimit, wildGenotype, type ExpeditionResult,
} from '@worldsea/shared';
import {
  biteAttempts, dailyCounters, expeditions, fish, items, playerItems, players, rareBites,
  regions, specialEncounters, species, speciesDailyCatches, wildPopulations,
} from '@worldsea/shared/db/main';
import type { Db } from '../db';
import { chooseSpecies, HUNT_TEMP, huntOutcome, random, weighted } from './hunt';

type Player = typeof players.$inferSelect;
type Expedition = typeof expeditions.$inferSelect;
type Species = typeof species.$inferSelect;
type Bite = typeof rareBites.$inferSelect;
const emptyResult = (): ExpeditionResult => ({ catches: [], gold: 0, premium: 0, exp: 0, items: [], misses: 0 });

/** 플레이어를 먼저 잠가 공유 스태미너와 결과의 중복 처리를 막는다. */
export async function advanceExpeditions(db: Db, playerId: string, now: Date): Promise<void> {
  // 자리를 비운 플레이어의 예약도 다른 요청에서 해제한다. 한 요청의 정리량은 제한한다.
  const overdue = await db.select({ playerId: rareBites.playerId }).from(rareBites)
    .where(and(eq(rareBites.status, 'pending'), lte(rareBites.expiresAt, now)))
    .groupBy(rareBites.playerId).orderBy(asc(rareBites.playerId)).limit(100);
  for (const id of new Set([...overdue.map((b) => b.playerId), playerId])) {
    await db.transaction(async (tx) => {
      const [player] = await tx.select().from(players).where(eq(players.id, id)).for('update');
      if (player) await settleExpeditions(tx, player, new Date(Math.max(now.getTime(), player.staminaUpdatedAt.getTime())));
    });
  }
}

/** 호출자는 플레이어 행 잠금을 보유해야 한다. 원정 시작에서도 같은 트랜잭션으로 호출한다. */
export async function settleExpeditions(tx: Db, player: Player, now: Date): Promise<void> {
  const running = await tx.select().from(expeditions).where(and(
    eq(expeditions.playerId, player.id), inArray(expeditions.status, ['active', 'completed']),
  ));
  const pending = await tx.select().from(rareBites).where(and(eq(rareBites.playerId, player.id), eq(rareBites.status, 'pending')));
  if (!running.some((e) => e.status === 'active' && e.endsAt <= now) && !pending.some((b) => b.expiresAt <= now)) return;

  const catalog = await tx.select().from(species);
  const regionCatalog = await tx.select().from(regions);
  const gearCatalog = await tx.select().from(items);
  // 여러 어종을 같은 배치에서 처리하므로 모든 요청에서 잠금 순서를 고정한다.
  // shortcut: 현재 120종의 야생 행을 잠근다. 어종·접속량이 늘면 선택 어종별 재시도 방식으로 바꾼다.
  const populations = await tx.select().from(wildPopulations).orderBy(asc(wildPopulations.speciesId)).for('update');
  const changed = new Set<string>();
  const byId = new Map(running.map((e) => [e.id, e]));

  const addCatch = (e: Expedition, s: Species) => {
    const result = e.result ??= emptyResult();
    const entry = result.catches.find((catch_) => catch_.speciesId === s.id);
    if (entry) entry.count++;
    else result.catches.push({ speciesId: s.id, count: 1 });
    changed.add(e.id);
  };
  const capture = async (e: Expedition, s: Species, at: Date) => {
    const genotype = wildGenotype(s.geneLoci);
    const [caught] = await tx.insert(fish).values({
      ownerId: player.id, speciesId: s.id, origin: 'wild', sex: random() < 0.5 ? 'male' : 'female',
      genotype, morphKey: morphKey(s.geneLoci, phenotype(s.geneLoci, genotype)),
      sizeCm: s.maxSizeCm * (0.6 + random() * 0.4), health: 90 + random() * 10,
      growthRate: 1, maturity: 1, caughtRegionId: e.regionId, expeditionId: e.id,
      pendingClaim: true, bornAt: at, statsUpdatedAt: at,
    }).returning({ id: fish.id });
    addCatch(e, s);
    const day = gameDay(at);
    const [counter] = await tx.select().from(speciesDailyCatches).where(and(eq(speciesDailyCatches.playerId, player.id), eq(speciesDailyCatches.day, day), eq(speciesDailyCatches.speciesId, s.id)));
    await tx.insert(speciesDailyCatches).values({ playerId: player.id, day, speciesId: s.id, count: (counter?.count ?? 0) + 1 })
      .onConflictDoUpdate({ target: [speciesDailyCatches.playerId, speciesDailyCatches.day, speciesDailyCatches.speciesId], set: { count: (counter?.count ?? 0) + 1 } });
    return caught!.id;
  };
  const quota = async (s: Species, at: Date): Promise<boolean> => {
    const p = populations.find((p) => p.speciesId === s.id);
    if (!p) return false;
    const percent = (p.count + p.reserved) / s.initialPopulation * 100;
    const limit = vulnerableDailyLimit(percent);
    if (p.status === 'protected' || p.status === 'extinct_wild' || limit === 0 || p.count < 1) return false;
    const day = gameDay(at);
    const [counter] = await tx.select().from(speciesDailyCatches).where(and(
      eq(speciesDailyCatches.playerId, player.id), eq(speciesDailyCatches.day, day), eq(speciesDailyCatches.speciesId, s.id),
    ));
    // 대기 중인 입질도 슬롯을 예약해 한도를 넘는 입질이 쌓이지 않게 한다.
    const reserved = pending.filter((b) => b.speciesId === s.id && b.status === 'pending').length;
    if (limit !== null && (counter?.count ?? 0) + reserved >= limit) return false;
    return true;
  };
  const savePopulation = async (s: Species) => {
    const p = populations.find((p) => p.speciesId === s.id)!;
    p.status = statusFromPercent((p.count + p.reserved) / s.initialPopulation * 100, p.status);
    p.version++;
    await tx.update(wildPopulations).set({ count: p.count, reserved: p.reserved, status: p.status, version: p.version }).where(eq(wildPopulations.speciesId, s.id));
  };
  const resolveAuto = async (bite: Bite, e: Expedition | undefined, s: Species, at: Date) => {
    const p = populations.find((p) => p.speciesId === s.id)!;
    let bonus = 0;
    let gearMissing = false;
    const used: { floatId?: string; baitId?: string } = {};
    if (!bite.pausedRepeat && e) {
      for (const kind of ['float', 'bait'] as const) {
        const id = kind === 'float' ? e.options.floatId : e.options.baitId;
        if (!id) continue;
        const [stock] = await tx.select().from(playerItems).where(and(eq(playerItems.playerId, player.id), eq(playerItems.itemId, id)));
        const item = gearCatalog.find((i) => i.id === id);
        if (!stock?.count || !item || (item.targetSpeciesId && item.targetSpeciesId !== s.id)) {
          if (!e.options.continueWithoutGear) gearMissing = true;
          continue;
        }
        used[kind === 'float' ? 'floatId' : 'baitId'] = id;
        bonus += item.chanceBonus;
      }
    }
    const auto = !bite.pausedRepeat && !!e && !gearMissing;
    if (auto) {
      for (const id of Object.values(used)) {
        const [stock] = await tx.select().from(playerItems).where(and(eq(playerItems.playerId, player.id), eq(playerItems.itemId, id)));
        await tx.update(playerItems).set({ count: stock!.count - 1 }).where(and(eq(playerItems.playerId, player.id), eq(playerItems.itemId, id)));
      }
    }
    const day = gameDay(at);
    const [dailyCatch] = await tx.select().from(speciesDailyCatches).where(and(eq(speciesDailyCatches.playerId, player.id), eq(speciesDailyCatches.day, day), eq(speciesDailyCatches.speciesId, s.id)));
    const limit = vulnerableDailyLimit((p.count + p.reserved) / s.initialPopulation * 100);
    const allowed = p.status !== 'extinct_wild' && p.status !== 'protected' && (limit === null || (dailyCatch?.count ?? 0) < limit);
    const success = auto && allowed && bite.minigameSeed / 0x80000000 < Math.min(0.95, HUNT_TEMP.autoChance[s.rarity] + bonus);
    p.reserved--;
    if (!success) p.count++;
    const fishId = success ? await capture(e!, s, at) : null;
    await savePopulation(s);
    if (auto) await tx.insert(biteAttempts).values({ biteId: bite.id, attemptNo: 1, ...used, isAuto: true, success, createdAt: at });
    bite.status = success ? 'caught' : auto ? 'escaped' : 'expired';
    await tx.update(rareBites).set({ status: bite.status, isAuto: auto, attemptsUsed: auto ? 1 : 0, fishId, resolvedAt: at }).where(eq(rareBites.id, bite.id));
    if (gearMissing && e?.status === 'active') {
      e.status = 'completed'; e.stopReason = 'gear_empty'; e.waitingForStamina = false;
      changed.add(e.id);
    }
  };
  const beginNext = async (e: Expedition, at: Date, huntSeconds: number) => {
    const st = computeStamina(player.stamina, player.staminaUpdatedAt, at, player.level);
    player.stamina = st.stamina; player.staminaUpdatedAt = st.updatedAt;
    if (player.stamina < e.staminaCost && e.options.recovery === 'premium') {
      const day = gameDay(at);
      const [counter] = await tx.select().from(dailyCounters).where(and(eq(dailyCounters.playerId, player.id), eq(dailyCounters.day, day), eq(dailyCounters.kind, 'buy_stamina')));
      if (e.premiumSpent + HUNT_TEMP.staminaPrice > (e.options.premiumCap ?? 0)) e.stopReason = 'premium_cap';
      else if (player.premium < HUNT_TEMP.staminaPrice) e.stopReason = 'premium_empty';
      else if ((counter?.count ?? 0) >= HUNT_TEMP.staminaDailyMax) e.stopReason = 'daily_limit';
      else {
        player.premium -= HUNT_TEMP.staminaPrice; e.premiumSpent += HUNT_TEMP.staminaPrice;
        player.stamina += HUNT_TEMP.staminaAmount;
        await tx.insert(dailyCounters).values({ playerId: player.id, day, kind: 'buy_stamina', count: (counter?.count ?? 0) + 1 })
          .onConflictDoUpdate({ target: [dailyCounters.playerId, dailyCounters.day, dailyCounters.kind], set: { count: (counter?.count ?? 0) + 1 } });
      }
    }
    if (player.stamina < e.staminaCost) {
      if (e.options.recovery === 'wait_regen') {
        e.waitingForStamina = true;
        e.endsAt = new Date(st.updatedAt.getTime() + (e.staminaCost - player.stamina) * staminaRegenSec(player.level) * 1000);
      } else {
        e.status = 'completed'; e.stopReason ??= 'stamina_empty'; e.waitingForStamina = false;
      }
      return;
    }
    player.stamina -= e.staminaCost;
    e.waitingForStamina = false;
    e.endsAt = new Date(at.getTime() + huntSeconds * 1000);
  };

  // 회차 종료·회복 대기·입질 만료를 하나의 시각 순서로 처리한다. 주기적인 틱은 없다.
  for (;;) {
    const e = running.filter((e) => e.status === 'active' && e.endsAt <= now).sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime() || a.id.localeCompare(b.id))[0];
    const bite = pending.filter((b) => b.status === 'pending' && b.expiresAt <= now).sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime() || a.id.localeCompare(b.id))[0];
    if (!e && !bite) break;
    if (bite && (!e || bite.expiresAt <= e.endsAt)) {
      await resolveAuto(bite, byId.get(bite.expeditionId), catalog.find((s) => s.id === bite.speciesId)!, bite.expiresAt);
      continue;
    }
    const current = e!;
    const at = current.endsAt;
    const region = regionCatalog.find((r) => r.id === current.regionId)!;
    changed.add(current.id);
    if (current.waitingForStamina) {
      await beginNext(current, at, region.huntSeconds);
      continue;
    }
    const result = current.result ??= emptyResult();
    const outcome = huntOutcome(player.missStreak);
    player.missStreak = outcome === 'miss' ? player.missStreak + 1 : 0;
    result.exp += HUNT_TEMP.exp;
    current.repeatDone++;
    if (outcome === 'miss') result.misses = (result.misses ?? 0) + 1;
    else if (outcome === 'gold') result.gold += HUNT_TEMP.gold * region.unlockStage;
    else if (outcome === 'premium') result.premium = (result.premium ?? 0) + HUNT_TEMP.premium;
    else if (outcome === 'item') {
      const item = weighted(gearCatalog.map((i) => [i, [65, 25, 8, 1.8, 0.2][['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(i.grade)]!] as const));
      if (item) {
        result.items ??= [];
        const entry = result.items.find((entry) => entry.id === item.id);
        if (entry) entry.count++; else result.items!.push({ id: item.id, count: 1 });
      } else result.gold += HUNT_TEMP.gold;
    } else {
      const s = chooseSpecies(catalog.filter((s) => s.regionId === region.id), region.unlockStage);
      if (!s) result.gold += HUNT_TEMP.gold;
      else if (!await quota(s, at)) {
        const reward = releaseReward(s.rarity, s.basePrice);
        result.gold += reward.gold; player.conservationPoints += reward.conservationPoints; player.shopExp += reward.shopExp;
      } else {
        const p = populations.find((p) => p.speciesId === s.id)!;
        p.count--;
        if (needsMinigame(s.rarity, player.minigameThreshold)) {
          p.reserved++;
          const high = rarityAtLeast(s.rarity, player.highGradeThreshold);
          const pausedRepeat = high && (current.options.highGradeBiteMode ?? player.highGradeBiteMode) === 'pause';
          const auto = high ? !pausedRepeat : (current.options.autoMinigame ?? player.autoMinigame);
          const [newBite] = await tx.insert(rareBites).values({
            expeditionId: current.id, playerId: player.id, speciesId: s.id, pausedRepeat,
            minigameSeed: Math.floor(random() * 0x7fffffff), createdAt: at,
            expiresAt: new Date(at.getTime() + RARE_BITE_TIMEOUT_SEC * 1000),
          }).returning();
          await savePopulation(s);
          pending.push(newBite!);
          if (pausedRepeat) { current.status = 'completed'; current.stopReason = 'high_grade_bite'; }
          if (auto) await resolveAuto(newBite!, current, s, at);
        } else {
          await capture(current, s, at);
          await savePopulation(s);
        }
      }
    }
    const special = catalog.filter((s) => s.regionId === region.id && s.isSpecialMapOnly);
    if (special.length && random() < region.specialMapChance) {
      const s = special[Math.floor(random() * special.length)]!;
      const expiresAt = new Date(at.getTime() + 86400 * 1000);
      await tx.insert(specialEncounters).values({ playerId: player.id, expeditionId: current.id, regionId: region.id, speciesId: s.id, createdAt: at, expiresAt, status: expiresAt <= now ? 'expired' : 'active' });
    }
    if (current.repeatDone === current.repeatTotal) current.status = 'completed';
    if (current.status === 'active') await beginNext(current, at, region.huntSeconds);
  }
  for (const e of running) {
    if (e.status === 'completed' && e.result && !hasExpeditionRewards(e.result) && !pending.some((b) => b.expeditionId === e.id && b.status === 'pending')) {
      e.status = 'claimed'; e.claimedAt = now; changed.add(e.id);
    }
  }
  for (const id of changed) {
    const e = byId.get(id)!;
    await tx.update(expeditions).set({ status: e.status, claimedAt: e.claimedAt, repeatDone: e.repeatDone, endsAt: e.endsAt, result: e.result, stopReason: e.stopReason, waitingForStamina: e.waitingForStamina, premiumSpent: e.premiumSpent }).where(eq(expeditions.id, id));
  }
  const st = computeStamina(player.stamina, player.staminaUpdatedAt, now, player.level);
  player.stamina = st.stamina; player.staminaUpdatedAt = st.updatedAt;
  await tx.update(players).set({ stamina: player.stamina, staminaUpdatedAt: player.staminaUpdatedAt, premium: player.premium, missStreak: player.missStreak, conservationPoints: player.conservationPoints, shopExp: player.shopExp }).where(eq(players.id, player.id));
}
