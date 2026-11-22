# 인증서 테두리 그림 생성 기록 (2026-11-22)

- 파일: `public/assets/certificate-frame-20261122.webp`(1600×1131, A4 가로 비율). 원본 `../image/certificate-frame-20261122-a.png`(1536×1024).
- 도구: GPT 이미지(Codex 내장 이미지 도구, `gpt-imagegen` 스킬). 생성 1회, 고른 판 1장.
- 참고 그림(`-i`): 05번 `5magnet/public/assets/quest/certificate-frame.webp`(장식 수준·배치만), 이 앱 `public/assets/restored.webp`, `public/assets/title-mate.webp`(그림체·색).
- 변환: sharp로 1600×1131에 맞춰 늘림(가로 약 6% 좁힘), WebP 품질 80.
- 쓰는 곳: 엔딩 인증서(`src/ui/stages-strategy.ts` certificatePage, `src/ui/certificate.css`), PNG 저장(`src/ui/cert-png.ts`).

## 프롬프트

> A landscape 3:2 certificate border frame illustration for a Korean elementary school science game about invisible germ traces and healthy habits. Use the first reference only for the level of ornament and layout (decorated corners, thin border line, wide empty centre); do NOT copy its gold, gears or magnets. Match the soft, bright, cute Korean children's anime painting style and palette of the other references: fresh teal and mint green, soft lavender purple, warm cream, sky blue. Border: a thin rounded teal double line with small leaf vines. Four corners decorated with this project's motifs: a magnifying glass, clear water droplets and soap bubbles, a pump soap bottle, softly glowing yellow-green handprint traces fading into golden sparkles, a small school building, a notebook and pencil. Top and bottom centre: a small ornament of bubbles and sparkles. The centre 65% of the image is plain, very light warm cream paper with subtle texture, completely empty for text. No text, no letters, no logos, no characters, no people.
