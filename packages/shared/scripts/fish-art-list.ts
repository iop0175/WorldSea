/**
 * docs/fish-prompts.md (120종 생성 프롬프트 + 그려야 할 파일)를 만든다.
 *   pnpm --filter @worldsea/shared exec tsx scripts/fish-art-list.ts > docs/fish-prompts.md
 * 생김새·모프 설명은 scripts/fish-art-notes.ts, 모프(유전자) 정의는 src/game/morphs.ts.
 */
import { expectedFishFiles, LAYER_SLOTS } from '../src/game/fishArt';
import { FISH_MORPHS } from '../src/game/morphs';
import { ALL_SPECIES, REGIONS } from '../src/seed/world';
import { RARITY_LABEL_KO } from '../src/game/constants';
import { MORPH_HINTS, NOTES } from './fish-art-notes';

const prompt = (en: string, sci: string | null, look: string) =>
  `pixel art sprite, side view, head facing left, single ${en}${sci ? ` (${sci})` : ''}, ${look}, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`;

const STAGE: Record<number, string> = { 1: '1단계', 2: '2단계', 3: '3단계', 4: '4단계 (고대)' };
const out: string[] = [];
const p = (s = '') => out.push(s);

p('# 물고기 생성 프롬프트 (120종)');
p();
p('규격과 작업 순서는 `docs/fish-art.md`. 이 문서는 `pnpm --filter @worldsea/shared exec tsx scripts/fish-art-list.ts > docs/fish-prompts.md`로 다시 만든다 (직접 고치지 말고 `scripts/fish-art-notes.ts`·`src/game/morphs.ts`를 고친다).');
p();
p('- **기본 프롬프트**: 야생형 한 장. 이것으로 `body`·`line`(+ 있으면 `fin_back`·`fin_front`·`pattern`)을 만든다.');
p('- **모프 프롬프트**: 같은 포즈·같은 크기로 생성해 해당 겹만 잘라 `<겹>.<모프 id>.png`로 저장한다. 기본 그림을 참고 이미지로 함께 넣으면 포즈가 잘 맞는다.');
p('- **색 모프**는 그림이 없다(팔레트만). 고대 어종과 오리지널은 아직 모프가 없어 기본 한 장이면 된다.');
p('- 정리: `python packages/client/scripts/fish-pixelize.py 생성.png 정리.png` → 겹 나누기 → 꼬리 2프레임(`fish-strip.py`) → 미리보기 확인.');
p();

let total = 0;
let morphTotal = 0;
for (const stage of [1, 2, 3, 4]) {
  const regions = REGIONS.filter((r) => r.unlockStage === stage);
  p(`## ${STAGE[stage]}`);
  p();
  for (const region of regions) {
    const list = ALL_SPECIES.filter((s) => s.regionId === region.id);
    p(`### ${region.nameKo} (${list.length}종)`);
    p();
    for (const s of list) {
      const n = NOTES[s.id];
      const m = FISH_MORPHS[s.id];
      total++;
      const tag = s.origin === 'fossil' ? ' · 고대' : s.origin === 'original' ? ' · 오리지널 특별 개체' : s.origin === 'original_legend' ? ' · 오리지널 전설급' : '';
      p(`#### ${s.nameKo} · \`${s.id}\` · ${RARITY_LABEL_KO[s.rarity]}${tag}`);
      p();
      if (!n) {
        p('- (생김새 메모 없음: scripts/fish-art-notes.ts에 추가)');
        p();
        continue;
      }
      p('기본:');
      p('```');
      p(prompt(n.en, s.scientificName, n.look));
      p('```');
      const colorLocus = m?.loci.find((l) => l.id === m.colorLocus);
      if (colorLocus) p(`- 색 모프(팔레트, 그림 없음): ${colorLocus.alleles.map((a) => a.nameKo).join(' · ')}`);
      const files = expectedFishFiles(m);
      p(`- 필수 파일: ${files.filter((f) => f.required).map((f) => `\`${f.name}\``).join(', ')}`);
      // 그림이 필요한 모프 (색 좌위 제외), 대립유전자마다 한 번
      for (const l of m?.loci ?? []) {
        if (!(LAYER_SLOTS[l.layer] ?? []).length) continue;
        for (const a of l.alleles) {
          if (a.id === l.wildTypeAlleleId) continue;
          const desc = n.morph?.[a.id] ?? MORPH_HINTS[a.id] ?? a.nameKo;
          const slots = (LAYER_SLOTS[l.layer] ?? []).map((x) => `${x}.${a.id}`);
          morphTotal++;
          p(`- 모프 **${a.nameKo}** → \`${slots.join('`, `')}\`${l.layer === 'fin' ? ' (fin_front는 다를 때만)' : ''}`);
          p('  ```');
          p(`  ${prompt(n.en, s.scientificName, `${desc}, same pose and size as the base image`)}`);
          p('  ```');
        }
      }
      p();
    }
  }
}
p('---');
p(`합계: 기본 ${total}장, 모프 ${morphTotal}장 (큰 그림 기준 생성 수. 작은 그림은 손 정리).`);
console.log(out.join('\n'));
