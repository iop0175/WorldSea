-- 월드씨 최종 안전장치
-- 게임 규칙은 Workers가 판정하지만, 코드 버그가 있어도 한정 바다가 깨지지 않도록 DB가 마지막으로 막는다.
-- 관리자 작업이 필요할 때는 트랜잭션 안에서 SET LOCAL worldsea.bypass_guard = 'on'; 을 먼저 실행한다.

-- 1) 보호종·야생 멸종 상태에서는 야생 개체수를 줄일 수 없다 (포획 금지).
--    늘리는 변경(방류, 자연 회복, 입질 반환)은 허용한다.
CREATE OR REPLACE FUNCTION guard_protected_population() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('worldsea.bypass_guard', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF OLD.status IN ('protected', 'extinct_wild')
     AND (NEW.count + NEW.reserved) < (OLD.count + OLD.reserved) THEN
    RAISE EXCEPTION 'species % is %, wild population cannot decrease', OLD.species_id, OLD.status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER wild_populations_guard_protected
  BEFORE UPDATE OF count, reserved ON wild_populations
  FOR EACH ROW EXECUTE FUNCTION guard_protected_population();
--> statement-breakpoint

-- 2) 교배 불가 어종(고대 전설급, 오리지널)은 교배에 넣을 수 없다.
CREATE OR REPLACE FUNCTION guard_breedable_parents() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM fish f
    JOIN species s ON s.id = f.species_id
    WHERE f.id IN (NEW.parent_a_id, NEW.parent_b_id)
      AND s.breedable = false
  ) THEN
    RAISE EXCEPTION 'non-breedable species cannot be bred'
      USING ERRCODE = 'check_violation';
  END IF;
  IF (SELECT count(DISTINCT species_id) FROM fish WHERE id IN (NEW.parent_a_id, NEW.parent_b_id)) <> 1 THEN
    RAISE EXCEPTION 'parents must be the same species'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER breedings_guard_breedable
  BEFORE INSERT ON breedings
  FOR EACH ROW EXECUTE FUNCTION guard_breedable_parents();
--> statement-breakpoint

-- 3) 경매 불가 어종은 경매에 올릴 수 없다.
CREATE OR REPLACE FUNCTION guard_auctionable_fish() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM fish f JOIN species s ON s.id = f.species_id
    WHERE f.id = NEW.fish_id AND s.auctionable = false
  ) THEN
    RAISE EXCEPTION 'species of fish % is not auctionable', NEW.fish_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER auctions_guard_auctionable
  BEFORE INSERT ON auctions
  FOR EACH ROW EXECUTE FUNCTION guard_auctionable_fish();
--> statement-breakpoint

-- 4) 기본 헌터 외형 (hunters.skin_id 기본값이 참조)
INSERT INTO hunter_skins (id, name_ko, grade, gacha_weight, sort_order)
VALUES ('default', '기본 헌터', 'common', 0, 0)
ON CONFLICT (id) DO NOTHING;
