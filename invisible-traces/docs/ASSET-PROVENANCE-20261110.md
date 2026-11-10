# Generated asset provenance, 2026-11-10

Tool: image_gen.imagegen. The response did not identify a precise model version. Source PNGs are preserved in the isolated worktree at asset-bank/original/overnight-20261110/ and excluded from Git. Existing source files were not overwritten or removed.

| Runtime asset | Use | Size | Visual inspection |
|---|---|---|---|
| public/assets/gym-20261110.webp | Gym cards, P01/P02/P09 | 1440x810 | A real gym, basketball hoop, shared balls, bench and lever door handle; no corridor collage |
| public/assets/meal-20261110.webp | Cafeteria and controlled experiment scenes | 1440x810 | Three friends, individual utensils, shared food and a dedicated serving ladle; no baked-in UI |
| public/assets/cough-uncovered-20261110.webp | P06 uncovered cough | 427x640, alpha | Same boy, bent-forward torso, closed eyes, open mouth, hands away from face; transparent background |

## Generation requirements

One asset per image. No collage, split panels, UI, text, numbers, arrows, cursors, watermark or magical particles. Friendly elementary-school 2D illustration, neutral light, no yellow/sepia tint. The gym is an empty coherent room. The lunch scene uses yellow, violet and green clothing and separate serving utensils. The coughing character was edited with cough-before-20261108.webp as a reference, preserving the character design, right-facing direction and clothes. Droplets remain a DOM model. The nearby friend retains the original standing pose.

## Integrity and conversion

The returned PNG data URLs were transferred in small base64 chunks to the external SSD. PNG signature, real sharp decoding, dimensions and SHA-256 were verified. Installed sharp performed only resizing and WebP conversion; image content was generated/edited with imagegen. All three final WebPs were opened for direct inspection. Cropping was then checked in the running app.

Source hashes:
- Gym: f72d8dc08f75e24499931dc824b95d44c56fe5529b192a166ec03cee4ff5b392 (1672x941)
- Lunch: a4ff4863f974502e13c93c1955c41271319d9a92bd10c61ba02e4273760965a7 (1672x941)
- Cough: 5441c3a25677135886ae3b95e5bbd7cc6ffe0cd47772eb5114b60f8c14a9d8ab (1025x1535, alpha)

Final runtime hashes and byte counts: reviews/overnight-20261110/asset-verification.json.

The existing concept video was not re-rendered and still uses its previous source illustration. The cough-pose correction applies to the interactive P06 experiment. Generated-image disclosure in the settings remains intact.
