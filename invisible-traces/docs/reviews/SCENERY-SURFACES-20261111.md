# Scenery-first interface review — 2026-11-11

Translucent background fills, restrained borders/shadows, readable foreground text and icons. Core/selected/disabled states and learning artwork preserved. Large reading dialogs retain stronger fill. No opacity applied to whole controls.

47 unit tests. 520 viewport/activity/large-text states pass with zero covered controls or runtime errors. Fixed playback speed versus next-lab button overlap at 360px enlarged-text mode.

Browser QA uses Chromium and seeded states; physical tablets, Safari, and every natural play route were not tested.

25 home/map/settings/records checks pass. Map labels covered by HUD are omitted while numbered destination buttons remain available; rotating portrait hint no longer covers restoration controls.

Follow-up: card family corners unified at 18px, peer-card gaps 12px (8px compact), equal stretch preserved. Existing single-screen observation layouts retained: artwork is not shrunk or hidden to fit controls.
