# Graph Report - WorldSea  (2026-10-09)

## Corpus Check
- 113 files · ~577,033 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 11, .example 2, .css 2)

## Summary
- 1000 nodes · 1537 edges · 66 communities (57 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App.tsx
- world.ts
- main.schema.ts
- shared/package.json
- server/package.json
- client/package.json
- HubScene.ts
- 월드씨 화면 구성 요소 목록 (v0.1)
- What You Must Do When Invoked
- HubScene
- constants.ts
- 6. 어종 표
- expeditions.ts
- 메인 화면(샵 1단계) 에셋 목록
- scripts
- api.test.ts
- 3. UI 요소
- Env
- smoke.ts
- 월드씨 (WorldSea)
- api/types.ts
- FishPreview.tsx
- 엔드포인트
- log.schema.ts
- shared/src/index.ts
- compilerOptions
- errors.ts
- app.ts
- verify.mjs
- fish-pixelize.py
- graphify reference: extra exports and benchmark
- Supabase 연결 설정
- client/tsconfig.json
- server/tsconfig.json
- graphify reference: query, path, explain
- shared/tsconfig.json
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- AGENTS.md
- extraction-spec.md
- README.md
- palette.ts
- fish-art-list.ts
- fishArt.ts
- 태평양 (11종)
- 남미 민물 (11종)
- 아시아 민물 (11종)
- 아프리카 민물 (11종)
- regions.ts
- 인도양 (10종)
- 데본기 (10종)
- 중미 민물 (10종)
- 북미 민물 (10종)
- fishArt.test.ts
- 유럽 민물 (9종)
- 북극해 (9종)
- 백악기 (9종)
- 대서양 (9종)
- morphs.ts
- stamina.test.ts
- 물고기 그림 규격 (디자인 결정 84~88번)
- 3단계
- db.ts

## God Nodes (most connected - your core abstractions)
1. `HubScene` - 23 edges
2. `hasAsset()` - 13 edges
3. `월드씨 (WorldSea)` - 13 edges
4. `6. 어종 표` - 13 edges
5. `MainScreen()` - 12 edges
6. `What You Must Do When Invoked` - 12 edges
7. `아시아 민물 (11종)` - 12 edges
8. `남미 민물 (11종)` - 12 edges
9. `태평양 (11종)` - 12 edges
10. `아프리카 민물 (11종)` - 12 edges

## Surprising Connections (you probably didn't know these)
- `App()` --indirect_call--> `hasAsset()`  [INFERRED]
  packages/client/src/ui/App.tsx → packages/client/src/game/assets.ts
- `FileTable()` --calls--> `hasAsset()`  [EXTRACTED]
  packages/client/src/preview/FishPreview.tsx → packages/client/src/game/assets.ts
- `FishPreview()` --calls--> `hasAsset()`  [EXTRACTED]
  packages/client/src/preview/FishPreview.tsx → packages/client/src/game/assets.ts
- `loadImage()` --calls--> `assetUrl()`  [EXTRACTED]
  packages/client/src/game/fishCompose.ts → packages/client/src/game/assets.ts
- `Stage()` --calls--> `composeFish()`  [EXTRACTED]
  packages/client/src/preview/FishPreview.tsx → packages/client/src/game/fishCompose.ts

## Import Cycles
- None detected.

## Communities (66 total, 9 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.07
Nodes (57): ApiRequestError, createPlayer(), fetchHealth(), getMe(), getRegions(), realtimeUrl(), request(), startExpedition() (+49 more)

### Community 1 - "world.ts"
Cohesion: 0.06
Nodes (50): db, sqlText, all, RARITY, STATUS, TIER, TREND, ConservationStatusValue (+42 more)

### Community 2 - "main.schema.ts"
Cohesion: 0.04
Nodes (50): aquariumRatings, auctionBids, auctions, auctionStatus, biteAttempts, biteStatus, breedings, breedingStatus (+42 more)

### Community 3 - "shared/package.json"
Cohesion: 0.05
Nodes (38): dependencies, drizzle-orm, zod, devDependencies, drizzle-kit, @electric-sql/pglite, postgres, tsx (+30 more)

### Community 4 - "server/package.json"
Cohesion: 0.06
Nodes (34): dependencies, drizzle-orm, hono, jose, postgres, @worldsea/shared, zod, devDependencies (+26 more)

### Community 5 - "client/package.json"
Cohesion: 0.06
Nodes (32): dependencies, galmuri, phaser, react, react-dom, @supabase/supabase-js, @worldsea/shared, zustand (+24 more)

### Community 6 - "HubScene.ts"
Cohesion: 0.11
Nodes (19): ASSET_URLS, files, SHEETS, SLICES, GAME_HEIGHT, GAME_WIDTH, LAYOUT, SpotKey (+11 more)

### Community 7 - "월드씨 화면 구성 요소 목록 (v0.1)"
Cohesion: 0.07
Nodes (26): 0. 공통 요소 (모든 화면), 1. 시작 흐름, 2-1. 허브 메인 (확정), 2-2. 시장 (확정: 하이브리드), 2-3. 길드 (확정), 2-4. 수족관 전시 (확정: 최종 콘텐츠), 2. 샵 탭 (허브), 3-1. 수조 목록 (확정) (+18 more)

### Community 8 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 10 - "constants.ts"
Cohesion: 0.11
Nodes (20): BITE_MAX_ATTEMPTS, BOTTOM_TAB_LABEL_KO, BOTTOM_TABS, DAILY_RESET_UTC_HOUR, DEFAULT_MINIGAME_THRESHOLD, gameDay(), HUNTER_SLOT_MAX, needsMinigame() (+12 more)

### Community 11 - "6. 어종 표"
Cohesion: 0.10
Nodes (19): 1. 원칙, 2. 변환 규칙, 3. 결과 요약, 4. 주의 사항, 5. 지역 (임시 수치), 6. 어종 표, 남미 민물 (Lv.10), 대서양 (Lv.25) (+11 more)

### Community 12 - "expeditions.ts"
Cohesion: 0.14
Nodes (8): loadMe(), STARTING, expeditions, hunters, items, players, subscriptions, hunterSlots()

### Community 13 - "메인 화면(샵 1단계) 에셋 목록"
Cohesion: 0.13
Nodes (14): 0. 만드는 법, 1. 배경, 2. 장면 객체, 3. 사람 (걷기 스프라이트 시트), 4. 물고기, 5. 효과, 6. UI 틀 (9-slice), 7. 아이콘 (+6 more)

### Community 14 - "scripts"
Cohesion: 0.12
Nodes (15): name, packageManager, pnpm, onlyBuiltDependencies, private, scripts, build, db:gen:log (+7 more)

### Community 15 - "api.test.ts"
Cohesion: 0.26
Nodes (8): app, AuthUser, jwksCache, keySetVerifier(), supabaseVerifier(), verifyWith(), View, jose

### Community 16 - "3. UI 요소"
Cohesion: 0.14
Nodes (13): ① 상단바 (한 줄), 1. 해상도와 화면 영역, 2. 공통 스타일, ② 샵 장면 위 UI, 3. UI 요소, ③ 헌터 띠, 4. 샵 장면 (탑다운 3/4 시점), ④ 하단 탭바 (+5 more)

### Community 18 - "smoke.ts"
Cohesion: 0.15
Nodes (8): clientDir, db, keys, migrations, pg, server, user, vite

### Community 19 - "월드씨 (WorldSea)"
Cohesion: 0.14
Nodes (13): 게임 시스템, 기술 스택, 등급, 명령어 (저장소 루트에서), 물고기 그림 (디자인 결정), 법적 원칙, 설계 원칙 (반드시 지킬 것), 수익 모델 (+5 more)

### Community 20 - "api/types.ts"
Cohesion: 0.15
Nodes (12): CreatePlayerBody, HunterView, huntOptionsBody, idempotencyKey, NICKNAME_RE, RegionDetailResponse, RegionKind, RegionSpeciesView (+4 more)

### Community 21 - "FishPreview.tsx"
Cohesion: 0.11
Nodes (16): checkFishFile(), composeFish(), FishFileCheck, GRAY_VALUES, grayIndex(), hexRgb(), imageCache, loadImage() (+8 more)

### Community 22 - "엔드포인트"
Cohesion: 0.17
Nodes (11): 공통 규칙, 기본·계정, 사육·교배, 소셜, 시장·상점, 실시간 채널 (WebSocket), 엔드포인트, 월드·도감 (+3 more)

### Community 23 - "log.schema.ts"
Cohesion: 0.17
Nodes (10): actionLogs, catchLogs, catchSource, currencyKind, currencyLogs, gachaLogs, populationLogs, populationReason (+2 more)

### Community 24 - "shared/src/index.ts"
Cohesion: 0.36
Nodes (8): AlleleDef, Dominance, ExpeditionResult, GeneLayer, Genotype, LocusDef, Reward, TankEquipment

### Community 25 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, forceConsistentCasingInFileNames, isolatedModules, module, moduleResolution, noEmit, resolveJsonModule, skipLibCheck (+2 more)

### Community 26 - "errors.ts"
Cohesion: 0.20
Nodes (7): errorBody(), HttpError, sendError(), requirePlayer(), ApiError, ApiErrorCode, hono

### Community 27 - "app.ts"
Cohesion: 0.19
Nodes (11): AppDeps, AppEnv, createApp(), defaultDeps, bearerToken(), TokenVerifier, Db, expeditionRoutes (+3 more)

### Community 28 - "verify.mjs"
Cohesion: 0.25
Nodes (6): [a,b,c], db, expectFail(), [guppy, bettaM], log, mainDir

### Community 29 - "fish-pixelize.py"
Cohesion: 0.11
Nodes (8): cut_mask(), keep_large(), luminance(), main(), main(), parse_size(), remove_bg(), to_gray_levels()

### Community 30 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 31 - "Supabase 연결 설정"
Cohesion: 0.20
Nodes (9): 1. 프로젝트 만들기, 2. 값 확인 (Project Settings), 3. 로그인 방식 켜기 (Authentication → Sign In / Providers), 4-1. 지역·어종 시드, 4. DB 마이그레이션, 5-1. Supabase 없이 원정 화면 테스트, 5. 로컬 실행, 6. 배포 (나중에) (+1 more)

### Community 32 - "client/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, jsx, lib, types, extends, include, ../../tsconfig.base.json

### Community 33 - "server/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, extends, include, ../../tsconfig.base.json

### Community 34 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 35 - "shared/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, types, extends, include, ../../tsconfig.base.json

### Community 36 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 37 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 38 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 45 - "fish-art-list.ts"
Cohesion: 0.18
Nodes (9): out, STAGE, FishNote, MORPH_HINTS, NOTES, RARITY_LABEL_KO, expectedFishFiles(), LAYER_SLOTS (+1 more)

### Community 46 - "fishArt.ts"
Cohesion: 0.21
Nodes (12): DEFAULT_PALETTE, DOMINANCE_RANK, FISH_SLOTS, FishFileSpec, FishLayer, FishSlot, hexToHsl(), hslToHex() (+4 more)

### Community 47 - "태평양 (11종)"
Cohesion: 0.17
Nodes (12): 개복치 · `mola_mola` · 영웅, 나폴레옹피시 · `cheilinus_undulatus` · 희귀, 넙치 (광어) · `paralichthys_olivaceus` · 일반, 만다린피시 · `synchiropus_splendidus` · 희귀, 별빛복어 · `orig_starpuffer` · 영웅 · 오리지널 특별 개체, 블루탱 · `paracanthurus_hepatus` · 고급, 옐로탱 · `zebrasoma_flavescens` · 고급, 참돔 · `pagrus_major` · 고급 (+4 more)

### Community 48 - "남미 민물 (11종)"
Cohesion: 0.17
Nodes (12): 구피 · `poecilia_reticulata` · 일반, 남미 민물 (11종), 네온 테트라 · `paracheirodon_innesi` · 일반, 디스커스 · `symphysodon_aequifasciatus` · 희귀, 레드벨리 피라냐 · `pygocentrus_nattereri` · 고급, 실버 아로와나 · `osteoglossum_bicirrhosum` · 희귀, 엔젤피시 · `pterophyllum_scalare` · 고급, 오스카 · `astronotus_ocellatus` · 고급 (+4 more)

### Community 49 - "아시아 민물 (11종)"
Cohesion: 0.17
Nodes (12): 금붕어 · `carassius_auratus` · 고급, 드워프 구라미 · `trichogaster_lalius` · 일반, 베타 · `betta_splendens` · 일반, 쉬리 · `coreoleuciscus_splendidus` · 희귀, 아시아 민물 (11종), 아시아 아로와나 · `scleropages_formosus` · 영웅, 월광비늘어 · `orig_moonscale` · 영웅 · 오리지널 특별 개체, 체리바브 · `puntius_titteya` · 일반 (+4 more)

### Community 50 - "아프리카 민물 (11종)"
Cohesion: 0.17
Nodes (12): 나일 틸라피아 · `oreochromis_niloticus` · 일반, 나일퍼치 · `lates_niloticus` · 영웅, 데모이소니 · `pseudotropheus_demasoni` · 고급, 브리샤르디 · `neolamprologus_brichardi` · 일반, 블루 돌핀 시클리드 · `cyrtocara_moorii` · 고급, 세네갈 비키르 · `polypterus_senegalus` · 고급, 아프리카 민물 (11종), 아프리카 버터플라이피시 · `pantodon_buchholzi` · 고급 (+4 more)

### Community 51 - "regions.ts"
Cohesion: 0.17
Nodes (4): regions, species, speciesDiscoveries, wildPopulations

### Community 52 - "인도양 (10종)"
Cohesion: 0.18
Nodes (11): 고래상어 · `rhincodon_typus` · 전설, 돛새치 · `istiophorus_platypterus` · 영웅, 만타가오리 · `mobula_birostris` · 영웅, 무어리시 아이돌 · `zanclus_cornutus` · 고급, 실러캔스 · `latimeria_chalumnae` · 전설, 쏠배감펭 · `pterois_miles` · 고급, 엠퍼러 엔젤피시 · `pomacanthus_imperator` · 고급, 인도양 (10종) (+3 more)

### Community 53 - "데본기 (10종)"
Cohesion: 0.18
Nodes (11): 데본기 (10종), 둔클레오스테우스 · `dunkleosteus_terrelli` · 전설 · 고대, 보트리올레피스 · `bothriolepis` · 고급 · 고대, 수정갑주어 · `orig_crystalarmor` · 영웅 · 오리지널 특별 개체, 스테타칸투스 · `stethacanthus` · 희귀 · 고대, 유스테놉테론 · `eusthenopteron` · 고급 · 고대, 케팔라스피스 · `cephalaspis` · 일반 · 고대, 크로노피시 · `orig_chronofish` · 전설 · 오리지널 전설급 (+3 more)

### Community 54 - "중미 민물 (10종)"
Cohesion: 0.18
Nodes (11): 레드 데빌 시클리드 · `amphilophus_labiatus` · 고급, 멕시코 테트라 · `astyanax_mexicanus` · 희귀, 몰리 · `poecilia_sphenops` · 일반, 소드테일 · `xiphophorus_hellerii` · 일반, 수정유리어 · `orig_crystalglass` · 영웅 · 오리지널 특별 개체, 재규어 시클리드 · `parachromis_managuensis` · 희귀, 중미 민물 (10종), 컨빅 시클리드 · `amatitlania_nigrofasciata` · 일반 (+3 more)

### Community 55 - "북미 민물 (10종)"
Cohesion: 0.18
Nodes (11): 무지개송어 · `oncorhynchus_mykiss` · 고급, 북미 민물 (10종), 블루길 · `lepomis_macrochirus` · 일반, 세일핀 몰리 · `poecilia_latipinna` · 일반, 안개은린어 · `orig_mistsilver` · 영웅 · 오리지널 특별 개체, 앨리게이터 가 · `atractosteus_spatula` · 영웅, 채널메기 · `ictalurus_punctatus` · 고급, 큰입배스 · `micropterus_salmoides` · 고급 (+3 more)

### Community 56 - "fishArt.test.ts"
Cohesion: 0.33
Nodes (10): FileTable(), FishPreview(), PaletteView(), Stage(), expressedAllele(), fishAssetKey(), fishLayerPlan(), morphKey() (+2 more)

### Community 57 - "유럽 민물 (9종)"
Cohesion: 0.20
Nodes (10): 강꼬치고기 · `esox_lucius` · 고급, 벨루가 철갑상어 · `huso_huso` · 전설, 브라운 송어 · `salmo_trutta` · 고급, 샘물요정송어 · `orig_fairytrout` · 영웅 · 오리지널 특별 개체, 웰스메기 · `silurus_glanis` · 영웅, 유럽 민물 (9종), 유럽 뱀장어 · `anguilla_anguilla` · 희귀, 유럽 퍼치 · `perca_fluviatilis` · 일반 (+2 more)

### Community 58 - "북극해 (9종)"
Cohesion: 0.20
Nodes (10): 그린란드 핼리벗 · `reinhardtius_hippoglossoides` · 고급, 그린란드상어 · `somniosus_microcephalus` · 전설, 늑대고기 · `anarhichas_lupus` · 희귀, 럼프피시 · `cyclopterus_lumpus` · 고급, 북극 홍어 · `amblyraja_hyperborea` · 희귀, 북극곤들매기 · `salvelinus_alpinus` · 고급, 북극대구 · `boreogadus_saida` · 일반, 북극해 (9종) (+2 more)

### Community 59 - "백악기 (9종)"
Cohesion: 0.20
Nodes (10): 길리쿠스 · `gillicus_arcuatus` · 고급 · 고대, 레피도테스 · `lepidotes` · 일반 · 고대, 백악기 (9종), 스쿠알리코락스 · `squalicorax` · 희귀 · 고대, 엔코두스 · `enchodus` · 일반 · 고대, 크레톡시리나 · `cretoxyrhina_mantelli` · 영웅 · 고대, 크시팍티누스 · `xiphactinus_audax` · 전설 · 고대, 폭풍턱어 · `orig_stormjaw` · 영웅 · 오리지널 특별 개체 (+2 more)

### Community 60 - "대서양 (9종)"
Cohesion: 0.20
Nodes (10): 대서양 (9종), 대서양 고등어 · `scomber_scombrus` · 일반, 대서양 대구 · `gadus_morhua` · 고급, 대서양 연어 · `salmo_salar` · 고급, 대서양 참다랑어 · `thunnus_thynnus` · 영웅, 대서양 청어 · `clupea_harengus` · 일반, 대서양 핼리벗 · `hippoglossus_hippoglossus` · 희귀, 유령장어 · `orig_ghosteel` · 영웅 · 오리지널 특별 개체 (+2 more)

### Community 61 - "morphs.ts"
Cohesion: 0.33
Nodes (9): FishPalette, palette(), AlleleSpec, intensityMorphs(), locus(), morphs(), patternLocus(), shadeLocus() (+1 more)

### Community 62 - "stamina.test.ts"
Cohesion: 0.36
Nodes (6): computeStamina(), STAMINA_TEMP, staminaMax(), staminaRegenSec(), StaminaState, t0

### Community 63 - "물고기 그림 규격 (디자인 결정 84~88번)"
Cohesion: 0.25
Nodes (7): 1. 크기와 파일 위치, 2. 프레임 (꼬리 흔들기 2프레임), 3. 겹 (아래 → 위 순서 고정), 4. 색 (팔레트 교체), 5. 작업 순서 (생성 도구 → 정리 → 겹 나누기), 6. 어종별 프롬프트, 물고기 그림 규격 (디자인 결정 84~88번)

### Community 64 - "3단계"
Cohesion: 0.33
Nodes (5): 1단계, 2단계, 3단계, 4단계 (고대), 물고기 생성 프롬프트 (120종)

## Knowledge Gaps
- **528 isolated node(s):** `name`, `private`, `packageManager`, `dev:client`, `dev:server` (+523 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 606 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `FishPreview.tsx`, `client/package.json`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `hono` connect `errors.ts` to `regions.ts`, `app.ts`, `server/package.json`, `expeditions.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `hasAsset()` connect `HubScene` to `fishArt.test.ts`, `App.tsx`, `FishPreview.tsx`, `HubScene.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `name`, `private`, `packageManager` to the rest of the system?**
  _528 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07099099099099099 - nodes in this community are weakly interconnected._
- **Should `world.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05764145954521417 - nodes in this community are weakly interconnected._
- **Should `main.schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03773584905660377 - nodes in this community are weakly interconnected._