// 조사 지도 에셋을 원본 그림(image/ 19번 학교, 30번 인물)에서 픽셀아트로 다시 만든다.
// 원본과 sharp는 저장소에 없으므로 필요할 때만 수동으로 돌린다.
//   SHARP_PATH=/path/to/node_modules/sharp node scripts/build-map-assets.cjs
const sharp = require(process.env.SHARP_PATH || 'sharp');
const { join } = require('node:path');

const image = n => join(__dirname, `../../image/chatgpt_generated_${n}.png`);
const out = name => join(__dirname, `../public/assets/${name}.webp`);
const FRAME = { width: 48, height: 58 }, SPRITE_HEIGHT = 54;
// [왼쪽, 위, 너비, 높이]: 30번 인물 시트에서 잘라 쓸 자세
const POSES = { heroStand: [845, 28, 225, 430], heroWalk: [1085, 40, 275, 415], mateStand: [15, 485, 245, 425] };

async function buildMap() {
  const width = 1115, height = 547;
  const png = await sharp(image(19))
    .extract({ left: 0, top: 70, width: 1672, height: 820 }) // 하늘과 흐린 앞쪽 잎을 덜어 낸다
    .modulate({ saturation: 1.12 }).resize(width, height, { kernel: 'lanczos3' }).sharpen({ sigma: .6 })
    .png({ palette: true, colors: 128, dither: .25 }).toBuffer();
  await sharp(png).webp({ lossless: true, effort: 6 }).toFile(out('school-map'));
}

async function pose([left, top, boxWidth, boxHeight]) {
  const width = Math.round(boxWidth * SPRITE_HEIGHT / boxHeight);
  const { data } = await sharp(image(30)).extract({ left, top, width: boxWidth, height: boxHeight })
    .resize(width, SPRITE_HEIGHT, { kernel: 'lanczos3', fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) data[i] = data[i] > 150 ? 255 : 0; // 반투명 테두리를 없앤다
  return { data, width, height: SPRITE_HEIGHT };
}

// 다리 부분만 좌우로 뒤집으면 반대 발이 나간 프레임이 된다.
function swapLegs({ data, width, height }, from = .64) {
  const next = Buffer.from(data);
  for (let y = Math.floor(height * from); y < height; y++) for (let x = 0; x < width; x++) {
    data.copy(next, (y * width + x) * 4, (y * width + width - 1 - x) * 4, (y * width + width - x) * 4);
  }
  return { data: next, width, height };
}

async function buildTeam() {
  const heroStand = await pose(POSES.heroStand), heroWalk = await pose(POSES.heroWalk), mateStand = await pose(POSES.mateStand);
  const frames = [heroStand, heroWalk, swapLegs(heroWalk), mateStand];
  const layers = await Promise.all(frames.map(async (frame, i) => ({
    input: await sharp(frame.data, { raw: { width: frame.width, height: frame.height, channels: 4 } }).png().toBuffer(),
    left: i * FRAME.width + Math.floor((FRAME.width - frame.width) / 2), top: FRAME.height - frame.height,
  })));
  const sheet = await sharp({ create: { width: FRAME.width * frames.length, height: FRAME.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers).png().toBuffer();
  const quantized = await sharp(sheet).png({ palette: true, colors: 48, dither: 0 }).toBuffer();
  await sharp(quantized).webp({ lossless: true, effort: 6 }).toFile(out('map-team'));
}

Promise.all([buildMap(), buildTeam()]).then(() => console.log('school-map.webp, map-team.webp 생성 완료'));
