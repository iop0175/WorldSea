# WorldSea P2 Asset Pack / 월드씨 P2 에셋

360x640 game design grid. All images are textless PNG files.
Region 12 IDs: asia_fresh, central_america_fresh, south_america_fresh, north_america_fresh, pacific, africa_fresh, europe_fresh, atlantic, indian, arctic, devonian, cretaceous

- `bg/region/*.png`: 336x96 opaque region banners (12)
- `ui/region/*.png`: 84x52 opaque thumbnails (12)
- `icon/vip_*.png`: 28x28 RGBA ranks (10)
- `guild/emblem_*.png`: 32x32 RGBA banners (8)
- `icon/*.png`: 12 miscellaneous P2 icons (12)
- `fx/*.png`: animated sprite sheets and static effects; exact frame metadata in manifest.json
- `bg/hdr_*.png`, `bg/restoration_event.png`: opaque banners; `bg/gacha_machine.png`: transparent prop

To integrate: copy file tree into `packages/client/src/assets/` then use assetUrl('directory/filename') in UI. Keep text separate as HTML/CSS. Scale pixel assets using `image-rendering: pixelated` and integer sizing where possible. 

Excluded for a later pack: giant hub stage 2-4 environments, store submission art, audio. All art in this package was newly rendered with raster pixel primitives; it is a baseline art set and visual review may lead to revisions.
