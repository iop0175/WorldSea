/**
 * 물고기 생성 프롬프트 원본: 어종별 영어 이름·생김새(야생형)와 모프 설명.
 * scripts/fish-art-list.ts 가 이 파일로 docs/fish-prompts.md 를 만든다.
 * 모프 설명이 없으면 대립유전자 id로 MORPH_HINTS 의 일반 설명을 쓴다.
 */
export interface FishNote {
  en: string;
  look: string;
  /** 대립유전자 id → 같은 포즈로 생성할 때 바꿀 생김새 */
  morph?: Record<string, string>;
}

/** 자주 쓰는 모프 id의 일반 설명 */
export const MORPH_HINTS: Record<string, string> = {
  faint: 'faint, barely visible markings',
  bold: 'bold, high-contrast markings',
  dense: 'many small dense spots',
  sparse: 'few scattered spots',
  wide: 'wider marking area',
  narrow: 'narrower marking area',
  longfin: 'long flowing fins',
  long: 'very long extended fin rays',
  tall: 'very tall sail-like fin',
  marble: 'irregular blotchy marble patches',
};

export const NOTES: Record<string, FishNote> = {
  // ---------------- 아시아 민물 ----------------
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

  // ---------------- 중미 민물 ----------------
  xiphophorus_hellerii: { en: 'green swordtail', look: 'slim livebearer, long sword extension on the lower tail', morph: { hifin: 'tall sail-like dorsal fin' } },
  xiphophorus_maculatus: { en: 'southern platy', look: 'small stocky livebearer, rounded tail', morph: { mickey: 'three-dot mickey mouse mark at the tail base', tuxedo: 'dark rear half of the body' } },
  poecilia_sphenops: { en: 'molly', look: 'stocky livebearer, rounded tail', morph: { dalmatian: 'white body covered in black dalmatian spots' } },
  amatitlania_nigrofasciata: { en: 'convict cichlid', look: 'compact cichlid with 8 dark vertical bars' },
  thorichthys_meeki: { en: 'firemouth cichlid', look: 'cichlid with a bright throat, dark spot on the gill cover' },
  amphilophus_labiatus: { en: 'red devil cichlid', look: 'heavy cichlid with thick lips and a slight nuchal hump' },
  astyanax_mexicanus: { en: 'Mexican tetra', look: 'small silvery tetra with an adipose fin', morph: { blind: 'cave form without eyes, skin over the eye sockets' } },
  parachromis_managuensis: { en: 'jaguar cichlid', look: 'large predatory cichlid, big mouth, dark spots all over' },
  atractosteus_tropicus: { en: 'tropical gar', look: 'very long cylindrical body, long toothy snout, rear-set dorsal fin, spotted' },

  // ---------------- 남미 민물 ----------------
  poecilia_reticulata: {
    en: 'guppy', look: 'small livebearer, short rounded tail fin',
    morph: { tuxedo: 'dark rear half of the body', mosaic: 'mosaic pattern on the tail', cobra: 'snakeskin cobra pattern on the body', delta: 'large triangular delta tail', sword: 'tail with a long sword extension' },
  },
  paracheirodon_innesi: { en: 'neon tetra', look: 'tiny slender tetra with a glowing horizontal stripe from eye to adipose fin' },
  corydoras_panda: { en: 'panda corydoras', look: 'small armored catfish, short barbels, dark eye patch and dark spot near the tail', morph: { longfin: 'long flowing fins' } },
  pterophyllum_scalare: {
    en: 'freshwater angelfish', look: 'tall triangular disc body, long trailing dorsal and anal fins, vertical stripes',
    morph: { marble: 'irregular marble patches instead of stripes', zebra: 'many thin zebra stripes', veil: 'extra long flowing veil fins' },
  },
  astronotus_ocellatus: { en: 'oscar cichlid', look: 'large oval cichlid, big head, eye spot on the tail base, irregular blotches' },
  pygocentrus_nattereri: { en: 'red-bellied piranha', look: 'deep body, blunt head, underbite with sharp teeth, bright belly' },
  symphysodon_aequifasciatus: {
    en: 'discus fish', look: 'round flat disc-shaped body, vertical bars',
    morph: { turquoise: 'wavy turquoise lines across the body', leopard: 'small dense leopard spots' },
  },
  osteoglossum_bicirrhosum: { en: 'silver arowana', look: 'very long ribbon-like body, large scales, upturned mouth with two chin barbels' },
  electrophorus_electricus: { en: 'electric eel', look: 'very long eel-like body, long anal fin along the belly, flat head' },
  arapaima_gigas: { en: 'arapaima (pirarucu)', look: 'huge long cylindrical body, flat head, large scales, red spots toward the tail', morph: { wide: 'red spots spread over most of the rear body', narrow: 'red spots only on the tail edge' } },

  // ---------------- 북미 민물 ----------------
  lepomis_macrochirus: { en: 'bluegill sunfish', look: 'deep oval sunfish, dark ear flap, faint vertical bars, colored cheek' },
  lepomis_gibbosus: { en: 'pumpkinseed sunfish', look: 'deep round sunfish, wavy cheek lines, dark ear flap with a bright edge, spotted body' },
  poecilia_latipinna: { en: 'sailfin molly', look: 'stocky livebearer, rounded tail, normal dorsal fin', morph: { sailfin: 'huge sail-like dorsal fin', dalmatian: 'white body with black dalmatian spots' } },
  micropterus_salmoides: { en: 'largemouth bass', look: 'robust bass, very large mouth reaching behind the eye, dark lateral band' },
  oncorhynchus_mykiss: { en: 'rainbow trout', look: 'streamlined trout, small black spots, pink lateral band, adipose fin' },
  ictalurus_punctatus: { en: 'channel catfish', look: 'long catfish, long barbels, forked tail, small dark spots' },
  polyodon_spathula: { en: 'American paddlefish', look: 'shark-like body with a very long flat paddle-shaped snout' },
  atractosteus_spatula: { en: 'alligator gar', look: 'huge torpedo body, broad alligator-like snout, rear-set fins, diamond scales, spotted' },
  acipenser_fulvescens: { en: 'lake sturgeon', look: 'long sturgeon, rows of bony plates, pointed snout with barbels, shark-like tail' },

  // ---------------- 태평양 ----------------
  paralichthys_olivaceus: { en: 'olive flounder', look: 'flat flatfish seen from the eyed side, both eyes on one side, long fringe fins' },
  amphiprion_ocellaris: {
    en: 'ocellaris clownfish', look: 'small rounded fish with three white bands outlined in black',
    morph: { snowflake: 'large irregular merged white patches', picasso: 'white patches covering most of the body' },
  },
  pagrus_major: { en: 'red sea bream', look: 'deep-bodied sea bream, steep forehead, small blue spots' },
  zebrasoma_flavescens: { en: 'yellow tang', look: 'tall flat disc-like surgeonfish, long snout, white spine near the tail' },
  paracanthurus_hepatus: { en: 'blue tang (palette surgeonfish)', look: 'oval surgeonfish with a dark palette-shaped marking and a bright tail' },
  synchiropus_splendidus: { en: 'mandarinfish', look: 'small dragonet with wavy maze-like stripes and fan fins' },
  cheilinus_undulatus: { en: 'humphead wrasse (Napoleon fish)', look: 'very large wrasse, prominent forehead hump, thick lips, wavy lines on the head' },
  mola_mola: { en: 'ocean sunfish (mola)', look: 'huge flat round body without a real tail, very tall dorsal and anal fins' },
  thunnus_orientalis: { en: 'Pacific bluefin tuna', look: 'torpedo-shaped tuna, dark back, silver belly, small yellow finlets, crescent tail' },
  makaira_nigricans: { en: 'blue marlin', look: 'long marlin with a spear bill, tall pointed dorsal fin, crescent tail, vertical stripes' },

  // ---------------- 아프리카 민물 ----------------
  labidochromis_caeruleus: { en: 'electric yellow cichlid', look: 'small cichlid with a dark edge on the dorsal fin' },
  neolamprologus_brichardi: { en: 'princess cichlid (Neolamprologus brichardi)', look: 'slender cichlid with lyre-shaped tail and long fin tips', morph: { longfin: 'very long fin tips and tail streamers' } },
  oreochromis_niloticus: { en: 'Nile tilapia', look: 'deep-bodied tilapia, faint vertical bars, striped tail' },
  pseudotropheus_demasoni: { en: 'demasoni cichlid', look: 'small cichlid with bold vertical bars', morph: { narrow: 'bars close together', wide: 'bars far apart' } },
  cyrtocara_moorii: { en: 'blue dolphin cichlid', look: 'cichlid with a big rounded forehead hump like a dolphin' },
  pantodon_buchholzi: { en: 'African butterflyfish', look: 'surface fish with huge wing-like pectoral fins, long thread rays, upturned mouth, spotted' },
  gnathonemus_petersii: { en: 'elephantnose fish', look: 'long fish with a trunk-like chin extension, two pale vertical lines near the tail' },
  polypterus_senegalus: { en: 'Senegal bichir', look: 'long eel-like body, row of small dorsal finlets, rounded pectoral fins' },
  cyphotilapia_frontosa: { en: 'frontosa cichlid', look: 'large cichlid with a big forehead hump and dark vertical bars', morph: { seven_bar: 'seven dark vertical bars' } },
  lates_niloticus: { en: 'Nile perch', look: 'large perch with a pointed head, humped back and rounded tail' },

  // ---------------- 유럽 민물 ----------------
  tinca_tinca: { en: 'tench', look: 'thick-bodied fish with tiny scales, small barbels, rounded fins, small red eye' },
  perca_fluviatilis: { en: 'European perch', look: 'perch with dark vertical bars, spiny first dorsal fin with a dark spot' },
  cyprinus_carpio: { en: 'common carp', look: 'large carp with barbels and full even scales', morph: { mirror: 'few large uneven mirror scales', leather: 'almost scaleless smooth skin' } },
  esox_lucius: { en: 'northern pike', look: 'long torpedo body, duck-bill snout, rear-set dorsal fin, light spots', morph: { stripe: 'light diagonal stripes instead of spots' } },
  salmo_trutta: { en: 'brown trout', look: 'trout with dark and red spots, adipose fin' },
  anguilla_anguilla: { en: 'European eel', look: 'long snake-like eel, continuous dorsal and anal fin' },
  silurus_glanis: { en: 'wels catfish', look: 'huge catfish, wide flat head, two very long barbels, long anal fin, tiny dorsal fin' },
  huso_huso: { en: 'beluga sturgeon', look: 'huge sturgeon, short pointed snout, big mouth, rows of bony plates' },

  // ---------------- 대서양 ----------------
  clupea_harengus: { en: 'Atlantic herring', look: 'slim silver schooling fish, forked tail' },
  scomber_scombrus: { en: 'Atlantic mackerel', look: 'streamlined mackerel with wavy dark stripes on the back, small finlets', morph: { fine: 'fine dense wavy stripes', bold: 'thick bold wavy stripes' } },
  gadus_morhua: { en: 'Atlantic cod', look: 'cod with three dorsal fins, chin barbel, pale lateral line, speckled' },
  salmo_salar: { en: 'Atlantic salmon', look: 'streamlined salmon, black cross-shaped spots, adipose fin' },
  holacanthus_ciliaris: { en: 'queen angelfish', look: 'tall angelfish with a crown spot on the forehead and trailing fins' },
  hippoglossus_hippoglossus: { en: 'Atlantic halibut', look: 'large flatfish seen from the eyed side, both eyes on one side, crescent tail' },
  thunnus_thynnus: { en: 'Atlantic bluefin tuna', look: 'large torpedo-shaped tuna, dark back, silver belly, yellow finlets, crescent tail' },
  xiphias_gladius: { en: 'swordfish', look: 'long fish with a very long flat sword bill, tall dorsal fin, crescent tail, no scales' },

  // ---------------- 인도양 ----------------
  acanthurus_leucosternon: { en: 'powder blue tang', look: 'oval surgeonfish with a dark face and a white throat' },
  pterois_miles: { en: 'devil firefish (lionfish)', look: 'lionfish with fan-like pectoral fins, venomous spines, vertical stripes', morph: { long: 'very long spines and fin rays' } },
  pomacanthus_imperator: { en: 'emperor angelfish', look: 'tall angelfish with horizontal stripes and a dark mask over the eye' },
  zanclus_cornutus: { en: 'Moorish idol', look: 'tall disc body, long tubular snout, very long trailing dorsal fin streamer, broad vertical bands', morph: { long: 'extra long dorsal streamer' } },
  balistoides_conspicillum: { en: 'clown triggerfish', look: 'triggerfish with large round spots on the belly and a spotted back', morph: { large: 'fewer, larger round spots', small: 'many small round spots' } },
  istiophorus_platypterus: { en: 'Indo-Pacific sailfish', look: 'long billfish with a huge sail-like dorsal fin covered in spots, spear bill', morph: { tall: 'even taller sail fin' } },
  mobula_birostris: { en: 'giant oceanic manta ray', look: 'manta ray seen from the side angled, wide wing fins, head fins (cephalic lobes)', morph: { heavy: 'dark markings on the belly', clean: 'clean pale belly' } },
  latimeria_chalumnae: { en: 'coelacanth', look: 'heavy lobe-finned fish, fleshy limb-like fins, three-lobed tail, white blotches' },
  rhincodon_typus: { en: 'whale shark', look: 'huge shark with a wide flat head, wide mouth, white spots and stripes on a dark back' },

  // ---------------- 북극해 ----------------
  boreogadus_saida: { en: 'Arctic cod (polar cod)', look: 'slender cod with a forked tail and small chin barbel' },
  mallotus_villosus: { en: 'capelin', look: 'small slender silvery smelt-like fish' },
  cyclopterus_lumpus: { en: 'lumpfish', look: 'round lumpy body with rows of bony bumps, suction disc on the belly' },
  reinhardtius_hippoglossoides: { en: 'Greenland halibut', look: 'elongated flatfish, eyes on one side, dark on both sides' },
  salvelinus_alpinus: { en: 'Arctic char', look: 'streamlined char with light spots and a colored belly, white-edged lower fins' },
  anarhichas_lupus: { en: 'Atlantic wolffish', look: 'long fish with a big head, strong canine teeth, dark vertical bands' },
  amblyraja_hyperborea: { en: 'Arctic skate', look: 'skate seen from the side angled, flat diamond body, long thin tail with thorns' },
  somniosus_microcephalus: { en: 'Greenland shark', look: 'large slow sleeper shark, small head, small fins, thick body' },

  // ---------------- 데본기 (고대) ----------------
  cephalaspis: { en: 'Cephalaspis (armored jawless fish)', look: 'prehistoric jawless fish with a horseshoe-shaped bony head shield, eyes on top, small tail' },
  bothriolepis: { en: 'Bothriolepis (placoderm)', look: 'prehistoric armored fish with a boxy plated front body and jointed arm-like pectoral appendages' },
  eusthenopteron: { en: 'Eusthenopteron (lobe-finned fish)', look: 'prehistoric lobe-finned fish, fleshy fins, three-lobed tail' },
  stethacanthus: { en: 'Stethacanthus (ancient shark)', look: 'prehistoric shark with an anvil-shaped brush dorsal fin covered in spikes' },
  cladoselache: { en: 'Cladoselache (ancient shark)', look: 'prehistoric slender shark with a crescent tail and two spiny dorsal fins' },
  tiktaalik_roseae: { en: 'Tiktaalik', look: 'prehistoric fish-tetrapod with a flat crocodile-like head, neck, sturdy fins like limbs' },
  hyneria_lindae: { en: 'Hyneria (giant lobe-finned fish)', look: 'huge prehistoric predatory lobe-finned fish, large head with fangs' },
  dunkleosteus_terrelli: { en: 'Dunkleosteus (giant placoderm)', look: 'huge prehistoric armored fish with a bony plated head and sharp blade-like jaw plates' },

  // ---------------- 백악기 (고대) ----------------
  enchodus: { en: 'Enchodus (saber-toothed herring)', look: 'prehistoric slender fish with huge fang teeth in the front of the jaw' },
  lepidotes: { en: 'Lepidotes (ray-finned fish)', look: 'prehistoric deep-bodied fish covered in thick shiny diamond scales' },
  gillicus_arcuatus: { en: 'Gillicus', look: 'prehistoric streamlined fish with a deep forked tail and small mouth' },
  protosphyraena: { en: 'Protosphyraena (swordfish-like)', look: 'prehistoric fish with a short sword snout and long sickle pectoral fins' },
  squalicorax: { en: 'Squalicorax (crow shark)', look: 'prehistoric shark with a typical shark body and serrated teeth' },
  cretoxyrhina_mantelli: { en: 'Cretoxyrhina (ginsu shark)', look: 'large prehistoric shark like a great white, crescent tail' },
  ptychodus: { en: 'Ptychodus (shell-crushing shark)', look: 'large prehistoric shark with a blunt head and flat crushing tooth plates' },
  xiphactinus_audax: { en: 'Xiphactinus', look: 'huge prehistoric bony fish with an upturned bulldog-like jaw full of fangs' },

  // ---------------- 오리지널 ----------------
  orig_moonscale: { en: 'fantasy moonlight scale fish', look: 'small elegant fish with crescent-shaped glowing scales' },
  orig_crystalglass: { en: 'fantasy glass fish', look: 'small fish with a transparent body showing bones and organs' },
  orig_goldspine: { en: 'fantasy golden spine fish', look: 'fish with tall spiky golden fin rays like spines' },
  orig_mistsilver: { en: 'fantasy mist silver fish', look: 'large graceful fish with wispy trailing fins like mist' },
  orig_flamecichlid: { en: 'fantasy flame cichlid', look: 'cichlid with flame-shaped pattern and flickering fin edges' },
  orig_fairytrout: { en: 'fantasy fairy trout', look: 'small trout with translucent wing-like fins' },
  orig_starpuffer: { en: 'fantasy star pufferfish', look: 'round pufferfish with star-shaped glowing dots like a constellation' },
  orig_ghosteel: { en: 'fantasy ghost eel', look: 'pale long eel with a ghostly flowing tail' },
  orig_pearldragon: { en: 'fantasy pearl dragon fish', look: 'elegant fish with pearly scales, whisker barbels and long flowing fins like a dragon' },
  orig_aurorasmelt: { en: 'fantasy aurora smelt', look: 'slender fish with shimmering bands across the body like an aurora' },
  orig_crystalarmor: { en: 'fantasy crystal armored fish', look: 'prehistoric armored fish with crystal plates on the head and body' },
  orig_stormjaw: { en: 'fantasy storm jaw fish', look: 'huge predatory fish with a massive jaw and lightning-shaped markings' },
  orig_chronofish: { en: 'fantasy time fish', look: 'mysterious fish with clock-like ring markings and fins of different ancient styles' },
};
