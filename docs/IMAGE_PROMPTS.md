# 메인·지도 이미지 생성 프롬프트

지금 게임은 있는 에셋만으로 돌아간다. 아래 그림은 품질을 더 올리고 싶을 때 쓰는 교체용이다. 없어도 게임은 그대로 동작한다.

## 사용 방법

1. 각 항목의 **참고 그림**을 함께 올리고 프롬프트를 붙여 넣는다. 같은 학교, 같은 인물로 나오게 하는 데 꼭 필요하다.
2. 결과물을 `image/` 폴더에 **저장 이름** 그대로 넣는다.
3. "이미지 넣었어"라고 말해 주면 잘라내기, 용량 줄이기, 교체, 화면 확인까지 내가 한다.

| 순서 | 저장 이름 | 어디에 쓰나 | 지금 상태 | 효과 |
| --- | --- | --- | --- | --- |
| 1 | `title_bg.png` | 메인 배경 | 지도와 같은 그림이라 로고가 본관 시계를 가림 | 가장 큼 |
| 2 | `title_hero.png` | 메인 왼쪽 인물 | 시트에서 잘라 높이 400px, 전자칠판에서 흐려짐 | 큼 |
| 3 | `title_mate.png` | 메인 오른쪽 인물 | 위와 같음 | 큼 |
| 4 | `map_walk_hero.png` | 지도 주인공 걷기 | 뒷모습이 없어 위로 걸을 때도 옆모습 | 보통 |
| 5 | `map_walk_mate.png` | 지도 동료 걷기 | 서 있는 그림 한 장뿐이라 미끄러지듯 움직임 | 보통 |

## 1. 메인 배경 `title_bg.png`

- **참고 그림:** `image/chatgpt_generated_19.png`
- **크기:** 가로 16:9, 가장 큰 크기(최소 1920×1080)
- **확인할 것:** 위쪽 가운데 하늘이 비어 있는지, 글자가 없는지, 아래쪽 양 끝에 인물이 설 자리가 있는지

```text
Use the attached image as the exact reference for the school: same main building with the clock tower and blue roof, same green-roofed gymnasium, same running track and soccer field, same art style and bright morning light.

Create a wide 16:9 title screen background for a children's science adventure game. Pull the camera further back and lower the whole school so it sits in the lower 60% of the frame. Keep the top 38% of the frame as open bright blue sky with a few soft clouds, and keep the center of that sky completely clear, because a large game logo will be placed there later.

Keep the elevated three-quarter isometric view. Add soft glowing mysterious trails floating around the school: one purple, one blue and one warm orange, each ending in a small glowing ring, as if invisible traces are slowly becoming visible. The mood is curious and hopeful, never scary.

Leave the bottom-left and bottom-right corners calm and simple with low bushes and paving, because characters will stand there. Keep the bottom center simple too, because buttons will be placed there.

Premium polished 3D storybook illustration, crisp detail, cheerful, for elementary school students. No people, no text, no letters, no numbers, no logos, no signs, no UI, no watermark.
```

## 2. 주인공 `title_hero.png`

- **참고 그림:** `image/chatgpt_generated_30.png`
- **크기:** 세로 2:3, 가장 큰 크기(최소 1024×1536), **배경 투명 PNG**
- **확인할 것:** 머리부터 신발까지 잘리지 않았는지, 돋보기를 든 소년인지

```text
Use the attached character sheet as the exact reference. Draw only the boy with short black hair, white and teal hooded jacket, dark cargo pants, navy backpack and blue-and-white sneakers. Keep the same face, proportions and cute chibi style.

Single full-body character on a fully transparent background. He strides forward with energy, holding a magnifying glass up to one eye, winking with a big happy smile, as if he has just found a clue. Three-quarter view facing right.

Show the whole body from the top of the hair to the bottom of the shoes with a small margin on every side. Clean sharp outlines, soft cel shading, high resolution. No ground shadow, no background, no extra objects, no sparkles, no text, no watermark.
```

## 3. 동료 `title_mate.png`

- **참고 그림:** `image/chatgpt_generated_30.png`
- **크기:** 세로 2:3, 가장 큰 크기(최소 1024×1536), **배경 투명 PNG**
- **확인할 것:** 머리부터 신발까지 잘리지 않았는지, 태블릿을 든 소녀인지

```text
Use the attached character sheet as the exact reference. Draw only the girl with long dark hair, purple headband, lilac sweater, blue cargo pants, small grey shoulder bag and white-and-lilac sneakers. Keep the same face, proportions and cute chibi style.

Single full-body character on a fully transparent background. She hugs a tablet with one arm and raises the other fist in the air, eyes closed in a big happy smile, stepping forward with joy. Three-quarter view facing left.

Show the whole body from the top of the hair to the bottom of the shoes with a small margin on every side. Clean sharp outlines, soft cel shading, high resolution. No ground shadow, no background, no extra objects, no sparkles, no text, no watermark.
```

## 4. 지도 주인공 걷기 `map_walk_hero.png`

- **참고 그림:** `image/chatgpt_generated_30.png`
- **크기:** 가로 3:2, 가장 큰 크기, **배경 투명 PNG**
- **확인할 것:** 인물 6개가 겹치지 않고 간격이 넉넉한지, 키가 모두 같은지. 픽셀로 줄이는 건 내가 한다.

```text
Use the attached character sheet as the exact reference. Draw only the boy with short black hair, white and teal hooded jacket, dark cargo pants, navy backpack and blue-and-white sneakers. Keep the same outfit and cute chibi proportions.

Create a clean walking turnaround sheet on a fully transparent background: 6 full-body poses in 2 rows of 3, evenly spaced, none touching, all the same height, with feet on the same baseline in each row.

Top row, seen from behind so the backpack is visible, walking away from the viewer: left foot forward, standing, right foot forward.
Bottom row, seen from the front, walking toward the viewer: left foot forward, standing, right foot forward.

Hands are empty and swing naturally. Simple clean shapes and strong silhouettes that stay readable at very small sizes. No ground shadow, no background, no extra objects, no text, no labels, no watermark.
```

## 5. 지도 동료 걷기 `map_walk_mate.png`

- **참고 그림:** `image/chatgpt_generated_30.png`
- **크기:** 가로 3:2, 가장 큰 크기, **배경 투명 PNG**
- **확인할 것:** 인물 9개가 겹치지 않고 간격이 넉넉한지, 키가 모두 같은지

```text
Use the attached character sheet as the exact reference. Draw only the girl with long dark hair, purple headband, lilac sweater, blue cargo pants, small grey shoulder bag and white-and-lilac sneakers. Keep the same outfit and cute chibi proportions.

Create a clean walking turnaround sheet on a fully transparent background: 9 full-body poses in 3 rows of 3, evenly spaced, none touching, all the same height, with feet on the same baseline in each row.

Top row, seen from behind, walking away from the viewer: left foot forward, standing, right foot forward.
Middle row, seen from the front, walking toward the viewer: left foot forward, standing, right foot forward.
Bottom row, side view facing left, walking: left foot forward, standing, right foot forward.

She holds a tablet against her chest with one arm in every pose. Simple clean shapes and strong silhouettes that stay readable at very small sizes. No ground shadow, no background, no extra objects, no text, no labels, no watermark.
```

## 공통 주의

- 그림 안에 글자가 들어가면 쓰지 않는다. 제목과 문구는 모두 게임에서 따로 얹는다.
- 투명 PNG가 안 나오면 단색 초록 배경으로 받아도 된다. 다만 머리카락 주변 품질이 떨어질 수 있다.
- 실제 학교나 실제 학생 사진은 참고 그림으로 쓰지 않는다.
