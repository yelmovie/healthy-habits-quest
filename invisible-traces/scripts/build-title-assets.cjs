// 메인 화면 에셋을 원본 그림(image/ 29번 제목, 30번 인물)에서 잘라 만든다.
// 원본과 sharp는 저장소에 없으므로 필요할 때만 수동으로 돌린다.
//   SHARP_PATH=/path/to/node_modules/sharp node scripts/build-title-assets.cjs
const sharp = require(process.env.SHARP_PATH || 'sharp');
const { join } = require('node:path');

const image = n => join(__dirname, `../../image/chatgpt_generated_${n}.png`);
const out = name => join(__dirname, `../public/assets/${name}.webp`);
const CUTOUTS = { 'title-hero': { left: 1080, top: 30, width: 285, height: 430 }, 'title-mate': { left: 512, top: 470, width: 262, height: 445 } };

// 시트의 색 번짐을 없애려고 알파를 조금 안쪽으로 깎고 가장자리만 부드럽게 둔다.
async function cutout(name, box) {
  const part = await sharp(image(30)).extract(box).ensureAlpha().toBuffer();
  const rgb = await sharp(part).removeAlpha().toBuffer();
  const alpha = await sharp(part).extractChannel(3).blur(1.1).linear(2.6, -210).toBuffer();
  const joined = await sharp(rgb).joinChannel(alpha).png().toBuffer();
  await sharp(joined).trim({ threshold: 1 }).webp({ quality: 90, alphaQuality: 95, effort: 6 }).toFile(out(name));
}

async function logo() {
  const trimmed = await sharp(image(29)).trim({ threshold: 1 }).png().toBuffer();
  await sharp(trimmed).resize({ width: 1300 }).webp({ quality: 90, alphaQuality: 95, effort: 6 }).toFile(out('title-logo'));
}

Promise.all([logo(), ...Object.entries(CUTOUTS).map(([name, box]) => cutout(name, box))]).then(() => console.log('메인 화면 에셋 생성 완료'));
