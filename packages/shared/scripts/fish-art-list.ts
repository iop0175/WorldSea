/**
 * docs/fish-art.md 의 "어종별 작업 목록"을 만든다 (생성 프롬프트 + 그려야 할 파일).
 *   pnpm --filter @worldsea/shared exec tsx scripts/fish-art-list.ts > /tmp/list.md
 * 지역을 늘릴 때: NOTES 에 영어 이름·생김새를 넣고 game/morphs.ts 에 모프를 정의한 뒤 다시 실행한다.
 */
import { expectedFishFiles } from '../src/game/fishArt';
import { FISH_MORPHS } from '../src/game/morphs';
import { ALL_SPECIES, REGIONS } from '../src/seed/world';

/** 생성 프롬프트용 영어 이름과 생김새 (야생형 기준) */
const NOTES: Record<string, { en: string; look: string; morph?: Record<string, string> }> = {
  betta_splendens: {
    en: 'betta fish (Siamese fighting fish)', look: 'plakat type with very short rounded fins and a short round tail, not long-finned, slender muscular body, upturned mouth',
    morph: { veil: 'long flowing veil tail drooping down', halfmoon: 'huge round tail spread in a 180 degree half circle', marble: 'irregular blotchy marble patches', butterfly: 'clear band at the outer edge of fins' },
  },
  trichogaster_lalius: { en: 'dwarf gourami', look: 'oval laterally compressed body, thread-like pelvic feelers, diagonal stripes' },
  trigonostigma_heteromorpha: { en: 'harlequin rasbora', look: 'small deep-bodied fish with a black triangular wedge patch on the rear half' },
  puntius_titteya: { en: 'cherry barb', look: 'small torpedo body, dark lateral stripe, tiny barbels' },
  carassius_auratus: {
    en: 'goldfish', look: 'common goldfish, chunky body, single short tail',
    morph: { comet: 'long deeply forked single tail', fantail: 'short double split tail fanned out', veil: 'very long flowing double veil tail' },
  },
  trichopodus_leerii: { en: 'pearl gourami', look: 'oval compressed body, thread-like pelvic feelers, covered in tiny pearl dots, dark zigzag line', morph: { reduced: 'fewer, larger pearl dots' } },
  chromobotia_macracanthus: { en: 'clown loach', look: 'elongated body, down-turned mouth with barbels, three thick vertical bands' },
  coreoleuciscus_splendidus: { en: 'Korean splendid dace', look: 'slender stream minnow, horizontal band along the side', morph: { faint: 'thin faded band', bold: 'thick vivid band' } },
  cyprinus_rubrofuscus: {
    en: 'koi carp', look: 'large carp body, barbels, full scales',
    morph: { spotted: 'large irregular patches over the back', doitsu: 'scaleless skin with a single row of big scales along the back' },
  },
  scleropages_formosus: { en: 'Asian arowana', look: 'long sword-shaped body, large metallic scales, upturned mouth with chin barbels, fins set far back' },
  xiphophorus_hellerii: { en: 'green swordtail', look: 'slim livebearer, long sword extension on the lower tail', morph: { hifin: 'tall sail-like dorsal fin' } },
  xiphophorus_maculatus: { en: 'southern platy', look: 'small stocky livebearer, rounded tail', morph: { mickey: 'three-dot mickey mouse mark at the tail base', tuxedo: 'dark rear half of the body' } },
  poecilia_sphenops: { en: 'molly', look: 'stocky livebearer, rounded tail' },
  amatitlania_nigrofasciata: { en: 'convict cichlid', look: 'compact cichlid with 8 dark vertical bars' },
  thorichthys_meeki: { en: 'firemouth cichlid', look: 'cichlid with a bright throat, dark spot on the gill cover' },
  amphilophus_labiatus: { en: 'red devil cichlid', look: 'heavy cichlid with thick lips and a slight nuchal hump' },
  astyanax_mexicanus: { en: 'Mexican tetra', look: 'small silvery tetra with an adipose fin', morph: { blind: 'cave form without eyes, skin over the eye sockets' } },
  parachromis_managuensis: { en: 'jaguar cichlid', look: 'large predatory cichlid, big mouth, dark spots all over', morph: { dense: 'many small dense spots', sparse: 'few scattered spots' } },
  atractosteus_tropicus: { en: 'tropical gar', look: 'very long cylindrical body, long toothy snout, rear-set dorsal fin, spotted', morph: { dense: 'heavy dark spotting', faint: 'faint sparse spots' } },
};

const prompt = (en: string, sci: string | null, look: string) =>
  `pixel art sprite, side view, head facing left, single ${en}${sci ? ` (${sci})` : ''}, ${look}, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`;

const ids = Object.keys(FISH_MORPHS);
for (const region of REGIONS) {
  const list = ALL_SPECIES.filter((s) => s.regionId === region.id && ids.includes(s.id));
  if (!list.length) continue;
  console.log(`\n### ${region.nameKo}\n`);
  for (const s of list) {
    const n = NOTES[s.id];
    const m = FISH_MORPHS[s.id]!;
    console.log(`#### ${s.nameKo} · \`${s.id}\`\n`);
    if (n) console.log(`- 기본(야생형) 프롬프트: \`${prompt(n.en, s.scientificName, n.look)}\``);
    const colorLocus = m.loci.find((l) => l.id === m.colorLocus);
    if (colorLocus) console.log(`- 색 모프(그림 없음, 팔레트): ${colorLocus.alleles.map((a) => a.nameKo).join(' · ')}`);
    const all = expectedFishFiles(m);
    const files = all.filter((f) => f.required || f.allele);
    console.log(`- 필수 파일: ${all.filter((f) => f.required).map((f) => `\`${f.name}\``).join(', ')}`);
    console.log(`- 선택 파일: ${all.filter((f) => !f.required).map((f) => `\`${f.name}\``).join(', ')}`);
    const variants = files.filter((f) => f.allele && f.slot !== 'fin_front');
    for (const f of variants) {
      const extra = n?.morph?.[f.allele!.id];
      const what = f.slot === 'fin_back' ? '지느러미 겹(fin_back·fin_front)' : f.slot === 'line' ? '눈 겹(line)' : `${f.slot} 겹`;
      console.log(`  - ${f.allele!.nameKo} → ${what}${extra ? `: 같은 포즈로 \`${extra}\`` : ''}`);
    }
    console.log('');
  }
}
