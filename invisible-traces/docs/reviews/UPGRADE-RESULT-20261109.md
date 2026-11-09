# 고도화 결과 — 12 보이지 않는 흔적 (2026-11-09 밤, 무인)

> 브랜치 `claude/upgrade-20261109`(시작 `2b7a34e` = 운영본). push·배포 안 함. 배포 빌드: `invisible-traces/dist` (`cd invisible-traces && npm run build`).
> 점수: 최종스킬 85 → 90 /100, 디자인스킬 125 → 127 /130 (`SCORE-20261109.md`). 계획: `UPGRADE-PLAN-20261109.md`.

## 바꾼 것

| 커밋 주제 | 파일 | 왜 |
|---|---|---|
| 점검 도구 | `scripts/check-release.mjs`(새로), `scripts/check-responsive-stages.mjs`(PORT·OUT), `docs/reviews/series12-qa/full-play.mjs` | 초기 로딩·대비·글자·터치·가림·200%·키보드·저장 복원을 한 번에 재고, 11-08 종합 탭 분리 뒤 멈추던 완주 검사를 고쳤다. 앱 코드 무변경 |
| 글자 대비 | `src/ui/style.css` | 흰 글자 주 버튼 3.2:1·보조 글자 4.3:1·주황 글자 2.9:1 → 토큰 `--teal-action`·`--orange-strong` 추가, `--muted`·`--teal-strong` 한 단계 진하게. 장소·단서 카드 hover 들림은 마우스 기기에서만 |
| 어휘 풀이 | `src/ui/stages-tracing.ts/.css`, `src/ui/concept-recall.ts` | 비말·타액 실험 제목 아래 한 줄 풀이(높이 520px 이하 가로 화면에서는 숨김), 병원체 풀이 |
| 검수·출처 기록 | `src/data/content.json`(review), `tests/model.test.ts`, `docs/ASSET-PROVENANCE-20261108.md` | 교사 검수 전 상태를 데이터로(needsReview=true), 11-08 생성 이미지 3장 출처를 저장소에 |
| 링크 미리보기 | `index.html`, `public/og-image.jpg`(1200×630, 177KB), `scripts/build-og-image.cjs` | 메인 화면 그림으로 합성한 OG·카톡 썸네일, 운영 주소 절대경로 |
| 개념 영상 | `../films/cough-etiquette/`(SPEC·REVIEW·소스), `public/assets/cough-etiquette-film.{webm,mp4}`, `-poster.webp`, `src/ui/concept-recall.*`, `tests/concept-film.test.ts`, `scripts/check-concept-film.mjs` | 연구 기록 '기침 예절' 칸이 가린 모습 한 장뿐이라 전·후 차이가 안 보였다. P06 비말 실험(5개 → 2개 남고 3개 흐려짐, 0 아님)을 게임 그림으로 다시 보여 주는 13.5초 무음 영상 |

### 개념 영상 1편

| 파일 | 길이 | 크기 | 형식 |
|---|---|---|---|
| `invisible-traces/public/assets/cough-etiquette-film.webm` | 13.5 s | 258,170 B | VP9 1280×720 |
| `invisible-traces/public/assets/cough-etiquette-film.mp4` | 13.5 s | 237,076 B | H.264 High 1280×720, faststart |
| `invisible-traces/public/assets/cough-etiquette-film-poster.webp` | 마지막 프레임 | 37,326 B | WebP 1280×720 |

원본 렌더는 1920×1080 30fps 405프레임(`hyperframes render -q delivery`). `hyperframes check` 오류 0, 스냅숏 7장 직접 확인(`films/cough-etiquette/REVIEW.md`). 음악·효과음 없음(앱 효과음은 코드 합성이라 쓸 파일이 없음). 앱에서는 자동재생 없이 사용자가 재생, 결론 문장은 그림 설명에도 있어 움직임 줄이기·재생 안 함에서도 남는다.

## 검증 명령과 실제 결과 (마지막 커밋 기준, 결과 파일은 외장 SSD `_claude_tmp/upgrade-20261109/tmp/12/after/`)

| 명령 | 결과 |
|---|---|
| `npm run check` | 통과 |
| `npm test` | 39 통과 / 0 실패 |
| `npm run build` | 통과(Phaser 1.21MB 청크 경고는 기존과 같음), precache 29파일 |
| `node scripts/check-release.mjs` (dev 5130 + preview 5131) | 시작 버튼 435 ms / 10Mbps 651 ms, 581 KB, 외부 도메인 0, 오프라인 첫 화면·지도 열림, 글자 최소 1920 18.5px·1024 15.8px, 버튼 가림 0, 200% 넘침 0, Esc 닫힘·포커스 복귀, 페이지 오류 0 |
| `node scripts/check-responsive-stages.mjs after` | 520건 문제 0, 페이지 오류 0 |
| `PORT=5130 node docs/reviews/series12-qa/full-play.mjs`(결과 경로만 외장 임시 폴더로) | PASS: P01~P10, 엔딩·인증서, 새로고침, 재실험 보존 |
| `URL=http://127.0.0.1:5131/ node scripts/check-concept-film.mjs` | 1280×800·1024×768·915×412·1920×1080(움직임 줄이기) 모두 webm readyState 4, 13.5 s, 1280×720, 포스터 200, 자동재생 없음 |
| 인증서 PDF(A4·배경 인쇄) | 1쪽 |
| `hyperframes check --json` (films/cough-etiquette) | 오류 0, 경고 3(의도된 그림 재사용, 로컬 글꼴, 첫 프레임 → 수정 후 재확인) |

## 미검증 항목과 이유

- 배포 뒤 확인(G7·G11·G18): 카톡·OG 미리보기가 운영 주소에서 실제로 뜨는지, 배포본 스모크. 이번 작업은 배포하지 않는다.
- mp4(H.264) 재생: 헤드리스 Chrome은 webm 을 골라 재생했다. mp4 는 ffprobe 로 길이·코덱만 확인했다(사파리·아이패드는 mp4 를 쓸 수 있음 — 실기 확인 필요).
- 영상 글꼴: 이 맥의 Apple SD Gothic Neo(로컬)로 렌더했다. 다른 기계에서 다시 렌더하면 글꼴이 달라질 수 있다.
- 실기 태블릿·전자칠판 터치·프레임, 스크린리더, 40분 수업 시간, 성취기준 원문 대조는 사람·실기기가 필요하다.
- 연구 기록을 펼친 상태의 기존 작은 글자(번호 15px·한계 문구 16px)는 1920 기준 18px 미달일 수 있다(계획 1-14).

## 남은 일 (계획서 번호)

1-8 터치 48px, 1-9 성취기준 원문 대조, 1-10 40분 실측, 1-11 저사양 프레임·blur, 1-12 `main.ts` 분리, 1-13 색 토큰화, 1-14 기록 펼침 글자, 1-15 배포 뒤 스모크 / 2-1 오답 이유 피드백, 2-2 뒤로가기 한 단계씩, 2-3 실험 탭 복원, 2-4 스크린리더, 2-5 무한 CSS 애니메이션 reduced, 2-6 백업 복원 UI / 3-2 개념 영상 2편 더, 3-3 흔적 되감기 연출, 3-4 창문 복원 합류(다른 세션).
