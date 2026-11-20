# 12 보이지 않는 흔적 · 필요한 그림 목록 (2026-11-21)

**새 그림이 필요한 자리: (가) 0장 · (나) 8장 · (다) 0장 = 8장.** 그림은 만들지 않았다. 아래 「조건부」는 권리 자료가 안 올 때만 생기는 일이라 장수에 넣지 않았다.

- 근거: 권리 장부 `docs/RIGHTS-LEDGER-20261121.md`, 할 일 목록 `docs/reviews/SCORE-100-TODO-20261120.md`, 운영 빌드 `dist` 그림을 직접 열어 본 것, `sips`로 잰 픽셀 크기, 2026-11-20 운영 빌드 스크린숏(`../.tmp/fix-20261120/after/1920x1080-C00.png`, `1280x800-P01.png`, `1280x800-C01.png`), 프로젝트가 먼저 적어 둔 교체 목록 `../docs/IMAGE_PROMPTS.md`.
- 경로는 `invisible-traces/` 기준이다(`assets/…` = `public/assets/…`, 빌드에서는 `dist/assets/…`). `../`로 시작하면 저장소 루트(`12 diseases/`), `_shared/`는 `iscreammedia_sc34/` 기준이다.
- 공통 규칙(`_shared/SCORE-110-PLAN-20261121.md` 「그림 보충」): `gpt-imagegen`으로 한 번에 한 장, 기존 화면 그림을 참고 그림(`-i`)으로 넣는다. 글자는 그림에 넣지 않는다. 원본은 덮어쓰지 않는다. 넣기 전후 같은 화면 스크린숏을 나란히 본다.

## (가) 권리 장부에서 「출처 미확인」인 그림

없음. 출처 미확인은 `assets/map-encounters/villain-left.png` 하나인데, 코드가 부르는 악당 그림은 `villain-redraw.png`(`src/map-encounter-theme.js`)라 이 파일은 화면에 나오지 않는다. 새 그림 대신 납품본에서 빼면 된다.

## (나) 화풍·해상도가 튀거나 임시로 넣은 그림

| # | 쓰이는 화면 | 지금 파일 | 필요한 크기·비율 | 화풍을 맞출 참고 그림 | 왜 필요한지 | 우선 |
|---|---|---|---|---|---|---|
| 1 | P01 이상 신호 관찰의 「교실」 카드, P02 단서판, P10 계획 그림의 대체 그림 | `assets/classroom.webp` 1440×810 | 1440×810(16:9). 카드에서 세로로 잘려 보이므로 가운데 40% 폭 안에 핵심 사물. 숨은 신호 자리 `SIGNAL_SPOTS.classroom = [30, 52]`(가로 30%·세로 52%) 근처에 함께 쓰는 물건(공·책 등)을 두거나, 바꾼 뒤 좌표를 다시 맞춘다 | `assets/gym-20261110.webp`, `assets/meal-20261110.webp`(같은 줄 카드), `assets/bg-classroom-20261116.webp`(같은 교실) | 같은 줄의 급식·체육 카드는 맑은 2D 셀 화풍인데 교실만 따뜻한 회화풍에 보라·파랑으로 빛나는 줄과 반짝이가 들어 있다(1280×800 P01 스크린숏에서 세 장이 나란히 보임). 2026-11-10 생성 기준(「magical particles 금지」)과도 어긋난다 | 높음 |
| 2 | 첫 화면 왼쪽 인물(과학 조사원) | `assets/title-hero.webp` 264×400 | 원본 2:3 투명 PNG 1024×1536 이상, 배포 WebP 높이 1100px 안팎. 지금 표시 높이 `min(50vh, 32vw)`(1920×1080에서 540px, 일부 배치 62vh) | `assets/dialogue/detective.webp`(같은 인물 최신 그림), `assets/reward-cards/card-1-0.webp`, `../image/chatgpt_generated_30.png` | 캐릭터 시트에서 잘라낸 400px 그림을 540px로 늘려 보여 준다(2배 화면이면 약 2.7배 확대). 프로젝트 문서도 「전자칠판에서 흐려짐」으로 적었다. 프롬프트는 `../docs/IMAGE_PROMPTS.md` 2절 | 높음 |
| 3 | 첫 화면 오른쪽 인물(기록 파트너) | `assets/title-mate.webp` 259×431 | 2번과 같음 | `assets/dialogue/recorder.webp`, `assets/reward-cards/card-1-0.webp`, `../image/chatgpt_generated_30.png` | 2번과 같은 이유. 이 그림은 기침 예절 영상 마지막 장면에도 들어가 있어, 바꾸면 영상(`../films/cough-etiquette`)도 다시 렌더해야 같은 인물이 된다. 프롬프트 `../docs/IMAGE_PROMPTS.md` 3절 | 높음 |
| 4 | 연구 기록 「핵심 개념 세 장면」 03 · 근거로 비교해요 | `assets/comparison.webp` 1440×810 | 960×540 이상(16:9) 한 장면. 화면에서는 폭 100%·높이 130~150px로 가로로 잘려 보이므로 가운데 띠에 핵심 | `assets/meal-20261110.webp`, `assets/plan-cafeteria-20261116.webp` | 좌우 두 칸으로 나뉜 합본 그림에 반짝이 입자가 들어 있다(2026-11-10 기준의 「split panels·magical particles 금지」). 150px 높이로 잘리면 두 칸 비교가 읽히지 않고, 바로 옆 기침 영상(맑은 2D)과 화풍이 다르다 | 보통 |
| 5 | 지도에서 걷는 조사원 | `assets/map-team.webp` 192×58 중 1~3칸(서기 1칸 + 다리만 뒤집은 걷기 2칸) | 원본 3:2 투명 시트(뒷모습 3 + 앞모습 3), 넣을 때 지금 칸 크기(48×58)로 픽셀 변환 | `assets/map-encounters/hero-redraw.png`(지금 지도 전투 그림), `assets/map-team.webp`, `../image/chatgpt_generated_30.png` | 옆모습 한 방향뿐이라 위아래로 걸을 때도 옆모습이다. 프로젝트 문서가 교체용으로 적어 둔 그림(`../docs/IMAGE_PROMPTS.md` 4절) | 보통 |
| 6 | 지도에서 걷는 기록 파트너 | `assets/map-team.webp` 4칸(서 있는 그림 1칸뿐) | 원본 3:2 투명 시트(뒤·앞·옆 각 3), 넣을 때 48×58 칸으로 픽셀 변환 | `assets/map-encounters/ally-redraw.png`, `assets/map-team.webp`, `../image/chatgpt_generated_30.png` | 걷기 그림이 없어 미끄러지듯 움직인다(`../docs/IMAGE_PROMPTS.md` 5절) | 보통 |
| 7 | 연구 기록 「핵심 개념 세 장면」 01 · 연결을 찾아요 | `assets/pathlab.webp` 1440×810 | 960×540 이상(16:9), 가운데 띠에 핵심 | `assets/bg-classroom-20261116.webp`, `assets/rel-contact-20261116.webp` | 광택 있는 회화풍 실험실로, 같은 줄의 기침 영상·지금 활동 그림(맑은 2D 셀)과 결이 다르다. 4번과 같은 줄이라 함께 바꾸면 세 장면이 한 화풍이 된다 | 낮음 |
| 8 | 첫 화면 배경 | `assets/school.webp` 1440×810(지도 바탕 그림과 같은 그림) | 16:9, 1920×1080 이상. 위쪽 38% 하늘을 비워 제목 자리, 아래 양 끝은 인물 자리. 지도 화면 바탕은 `school.webp`를 그대로 쓰므로 새 파일로 따로 둔다 | `../image/chatgpt_generated_19.png`, `assets/school-map.webp` | 지도와 같은 그림이라 제목 로고가 본관 위를 덮는다(1920×1080 첫 화면 스크린숏에서 시계탑이 로고 뒤에 가려짐). 프로젝트 문서의 교체 1순위(`../docs/IMAGE_PROMPTS.md` 1절). 지금도 화면은 깨지지 않아 우선은 낮게 둠 | 낮음 |

열어 보고 넣지 않은 것: `restored.webp`(엔딩 바탕, 55% 불투명도로만 깔림), `gym/meal-20261110`, 2026-11-12·11-16 그림 28장, 성취 카드 10장, 대화 초상 2장, 지도 전투 스프라이트 3장, `school-map.webp`(지도는 픽셀 그림으로 의도한 것). 해상도가 표시 크기보다 작거나 화풍이 튀는 것을 찾지 못했다. 쓰지 않는 옛 배경 5장(`condition`·`field`·`impact`·`lab`·`strategy`)은 화면에 나오지 않아 뺐다.

## (다) 게임성·화면 보강에 필요한 소품·배경

없음. `SCORE-100-TODO-20261120.md`에는 A17·C14 같은 게임성·화면 보강 줄이 없다. 남은 줄(C9 글자 대비, D8 리스너, Phaser 큰 청크, 인증서 인쇄 장식 띠, 보상 「받기」 연타)은 코드·CSS로 풀고 새 그림이 필요 없다.

## 조건부: 옛 ChatGPT 그림의 권리 자료가 안 오면

권리 장부 「사용자가 줘야 하는 자료」 1번이 없으면(결정 7: 「출처 모르는 옛 그림은 새로 만들어 교체」) 아래도 3-3단계에서 새로 그려야 한다. 위 (나)와 겹치는 것은 (나) 번호를 적었다.

| 지금 파일 | 쓰이는 곳 | 겹침 |
|---|---|---|
| `assets/school.webp` | 첫 화면 배경, 지도 화면 바탕 | (나) 8 — 지도 바탕까지 같이 바꿔야 함 |
| `assets/school-map.webp` | 지도(픽셀 그림, 1115×547) | 새로 |
| `assets/classroom.webp` | P01·P02·P10 | (나) 1 |
| `assets/restored.webp` | 엔딩 바탕 | 새로 |
| `assets/pathlab.webp`, `assets/comparison.webp` | 연구 기록 세 장면 | (나) 7·4 |
| `assets/title-logo.webp` | 첫 화면 제목(글자가 그림에 들어 있음) | 새로. 글자는 코드나 직접 디자인으로 |
| `assets/title-hero.webp`, `assets/title-mate.webp` | 첫 화면 인물 | (나) 2·3 |
| `assets/map-team.webp` | 지도 걷기 | (나) 5·6 |
| `og-image.jpg`, `cough-etiquette-film.*` | 링크 미리보기, 개념 영상 | 그림을 바꾼 뒤 스크립트·HyperFrames로 다시 만들면 됨(새 그림 없음) |

이 경우 (나)의 8장(모두 위 표와 겹침)에 `school-map`, `restored`, `title-logo` 3장이 더해져 11장이 된다.
