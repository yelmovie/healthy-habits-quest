// 링크 미리보기(카카오톡·OG)용 1200×630 이미지를 이미 쓰는 메인 화면 그림으로 합성한다.
// 새 그림을 만들지 않는다: 학교 배경(school), 제목(title-logo), 두 인물(title-hero, title-mate).
//   SHARP_PATH=/path/to/node_modules/sharp node scripts/build-og-image.cjs
const sharp = require(process.env.SHARP_PATH || 'sharp');
const { join } = require('node:path');
const asset = n => join(__dirname, `../public/assets/${n}.webp`);

(async () => {
  const bg = await sharp(asset('school')).resize(1200, 630, { fit: 'cover', position: 'centre' }).toBuffer();
  const logo = await sharp(asset('title-logo')).resize({ width: 760 }).toBuffer();
  const hero = await sharp(asset('title-hero')).resize({ height: 360 }).toBuffer();
  const mate = await sharp(asset('title-mate')).resize({ height: 360 }).toBuffer();
  const [l, h, m] = await Promise.all([logo, hero, mate].map(b => sharp(b).metadata()));
  await sharp(bg)
    .composite([
      { input: logo, left: Math.round((1200 - l.width) / 2), top: 36 },
      { input: hero, left: 70, top: 630 - h.height - 18 },
      { input: mate, left: 1200 - m.width - 70, top: 630 - m.height - 18 },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(__dirname, '../public/og-image.jpg'));
  console.log('public/og-image.jpg 1200×630');
})();
