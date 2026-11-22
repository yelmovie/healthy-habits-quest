# 납품 안내 · 보이지 않는 흔적 (12 diseases)

기존 인계 문서(원본 그대로 둠): [`../docs/WORK_STATUS.md`](../../docs/WORK_STATUS.md)(재개 메모), [`../README.md`](../../README.md), [`../docs/PRD.md`](../../docs/PRD.md)·`TRD.md`, 최신 검토 [`reviews/RELEASE-REVIEW-20261120.md`](reviews/RELEASE-REVIEW-20261120.md). 교사용 안내: [`TEACHER-GUIDE.md`](TEACHER-GUIDE.md).

## 1. 한눈에

| 항목 | 값 |
|---|---|
| 프로젝트 | 보이지 않는 흔적(12번, 초등 과학 감염병 탐구), 앱 버전 1.0.0 |
| 운영 주소 | https://healthy-habits-quest.yelsam.workers.dev/ |
| 저장소 | https://github.com/yelmovie/healthy-habits-quest (`main`). 저장소 뿌리는 `12 diseases/`이고 앱은 `invisible-traces/` 안에 있음 |
| 현재 앱 커밋 | `78896a2` (2026-11-22, 인증서 숫자 요약 미표시·화면/PNG 제목 획 동기화) |
| 운영 반영 확인 | Workers `6c1807dc-d04b-4730-95e0-bfd32ebd15f3` 100% 활성, 공식 주소 index·JS/CSS·서비스워커·인증서 테두리 7개 SHA-256 MATCH. 세뷰·PDF·PNG 확인(아래 최신 운영 확인) |

## 2. 폴더 구조

저장소 뿌리 `12 diseases/`: `invisible-traces/`(앱), `docs/`(기획·재개 메모), `README.md`, `image/`·`files/`(원본 참고 자료, 배포 안 됨), `films/`(기침 예절 영상 제작), `thumbnails/`(납품 썸네일 16×8·1×1), `graphify-out/`.

앱 `invisible-traces/`:
- 배포되는 것: `index.html`, `src/`(TypeScript 앱·`data/content.json`·`narration.json`), `public/`(`sw.js` 서비스 워커, 글꼴, `assets/` 최적화 그림·소리·영상), 빌드 결과 `dist/`
- 배포용 작은 Worker: `worker/media-range.js`
- 보관용: `docs/`(출처·점검·교사 검수표), `asset-bank/`(원본 자산), `scripts/`(검사·자산 만들기), `tests/`, `output/`, `references/`

## 3. 실행·빌드·검사 명령 (`invisible-traces/package.json`)

```
cd invisible-traces
npm ci
node "/Volumes/T7 Shield/DevMaintenance/add-native-binaries.mjs"   # 맥·윈도우 공용 node_modules일 때
npm run check     # tsc --noEmit
npm test          # node --import tsx --test tests/*.test.ts
npm run dev       # vite 개발 서버(127.0.0.1)
npm run build     # tsc + vite build + 오프라인 캐시 목록(scripts/postbuild-precache.mjs)
npm run preview   # 빌드 결과 확인(서비스 워커는 이때만 동작)
```

`scripts/check-*.mjs`는 브라우저로 도는 개별 검사입니다. 최신 결과는 타입 검사·빌드·테스트 71개 통과(2026-11-22, `../../docs/WORK_STATUS.md`)입니다.

## 4. 배포

- 호스팅: Cloudflare **Workers**(정적 자산 + Worker), 이름 `healthy-habits-quest`.
- 영상 탐색 요청(Range) 처리: `worker/media-range.js`. 정적 자산이 Range 요청에 200으로 전체 파일을 보내는 문제를 막으려고 `/assets/cough-etiquette-film.mp4`·`.webm`, `/assets/map-encounters/*`, `/assets/story/*`는 Worker가 먼저 받아 206으로 응답합니다.
- 설정 파일은 저장소 밖 작업 폴더에 있습니다: `_scratch/deploy-20261118/cfg/12.json`(`main`, `assets.binding`, `assets.run_worker_first`), 배포 스크립트 `_scratch/deploy-20261118/deploy.sh`(`worker-cfg` 종류, 앱 하위 폴더 `invisible-traces`). **이 설정 없이 배포하면 Worker가 빠져 영상 탐색이 깨집니다**(`docs/WORK_STATUS.md`).
- 푸시로 자동 배포되는 워크플로는 없습니다(`.github` 없음). 배포는 위 스크립트로 직접 합니다.

## 5. 다른 호스팅으로 옮길 때 챙길 것

- 정적 파일: `invisible-traces/dist/` 전체(오프라인 캐시 목록 `precache-manifest.json` 포함).
- 서비스 워커 `public/sw.js`(빌드 시 루트로 복사)는 같은 오리진 루트에서 서빙해야 합니다. 206 응답은 캐시에 넣지 않고 그대로 돌려주는 처리가 들어 있습니다.
- 영상·음원 Range(206) 응답은 필수입니다. 지원하지 않으면 `worker/media-range.js`와 같은 처리를 넣습니다.
- `run_worker_first` 경로 목록과 `not_found_handling: none`, `html_handling: auto-trailing-slash`를 새 호스팅에서 맞춥니다.
- 환경 값·API 키·서버는 없습니다. 기록은 브라우저 localStorage(`invisible-traces-science-save-v1`)에만 저장됩니다. 공개·로컬 주소는 origin이 달라 저장이 따로 됩니다.

## 6. 버전과 변경 이력 (`git log`)

- 2026-11-22 `78896a2` 인증서 숫자 요약 미표시, 화면과 PNG의 제목 획 동기화
- 2026-11-22 `38de30f` 첫 화면을 시작하기·새로 시작/이어 하기 중심으로 정리
- 2026-11-22 `948b223` A4 가로 인증서·손기입 빈칸·PNG 저장
- 2026-11-22 `f21c505` 파이널 영상 자막 두 줄이 18초에 겹치던 것 수정
- 2026-11-22 `6ee0b6d` 파이널 장면 F-1을 Gemini Veo 영상으로 교체
- 2026-11-21 `b75e609` 이야기 영상 마무리(영상 안 자막, 전체 화면 재생, 설정에서 다시 보기)
- 2026-11-21 `751eff2`·`2265fef` 파이널 장면 F-1(Flow)·F-3(Gemini) 영상 교체
- 2026-11-21 `b5be85a` 인트로·파이널 이야기 영상 추가(건너뛰기 가능)
- 2026-11-21 `0c5cd64` 시작 화면 인물 고해상도로 다시 그림
- 2026-11-21 `8f74abe` 브라우저 뒤로 가기는 앱 안에서
- 2026-11-21 `46d7871`·`334d3ea` 잠긴 카드 문구 18px, 버튼 대비, 인증서 흰 바탕 인쇄
- 2026-11-20 `f3272d2` 영상 Range 206 Worker, `ec5aa89` 제작·저작권 표기 한 문구

## 7. 권리·출처

[`RIGHTS-LEDGER-20261121.md`](RIGHTS-LEDGER-20261121.md). 요약: 31줄 중 확인됨 29줄·근거 약함 2줄(`favicon.svg` 손으로 쓴 SVG, 지도 파이널 영상에 구워 넣은 시스템 글꼴 글자)·출처 미확인 0줄. 그림은 Codex(GPT 이미지), 이야기 영상은 Google Flow·Gemini 앱(Veo), 배경음 Suno, 목소리 ElevenLabs, 글꼴 OFL. 요금제 화면 사본은 사용자 자료 대기입니다.

## 8. 알려진 한계와 남은 일 (`reviews/SCORE-20261121.md`, 93점·실기기 제외 97점)

- 큰 `main.ts`(336줄·약 54KB, 기준 40KB)는 옮기기만으로 줄이지 못해 3-4단계 2차에서 중단했습니다(코드 −1).
- Phaser 큰 청크(성능 −1). 학교 태블릿 FPS, 상시 blur 실기 비용, iOS 실물 인쇄는 실기기 대기입니다.
- 교사 검수(`TEACHER-REVIEW-20261121.md`)는 자료 대기입니다. 학기와 예상 수업 시간은 확인이 필요합니다.
- `SCORE-20261121.md`의 「아웃트로 F-1은 임시 판」 문장은 이후(2026-11-22 `6ee0b6d`) Gemini 영상으로 교체되어 낡았습니다. 원본은 고치지 않았습니다.

## 운영 대조 기록 (2026-11-22 12:56)

- 조율 세션이 운영 주소의 `index`와 스크립트·스타일 파일 4개를 저장소 `origin/main`과 대조했습니다. 결과는 모두 일치입니다(불일치 0).
- 위 본문에 「운영 반영 확인 필요」로 적힌 칸은 이 대조로 확인된 것입니다. 이후 앱을 다시 배포하면 `_scratch/final-recheck-20261120/prodcmp.sh 12`로 다시 대조합니다.


## 인증서 최신 운영 확인 · 2026-11-22 20:27

- 앱 `78896a2`를 main에 푸시하고 기존 Workers `healthy-habits-quest` 버전 `6c1807dc-d04b-4730-95e0-bfd32ebd15f3`로 배포했습니다. 공식 운영 주소는 그대로입니다.
- 인증서 종이의 미션·연구 기록 숫자 요약을 빼고, 제목 900과 동색 .018em 획을 화면·PNG에 맞췄습니다. 수여 문장·날짜·기획·제작 표기·기존 완료 판정과 저장은 유지했습니다.
- 타입 검사·테스트 71개·빌드·Wrangler dry-run 통과. 로컬과 운영 1280×800·1024×768·1920×1080에서 전체 종이·버튼 표시, 화면 입력 0·숫자 요약 0·겹침/넘침/콘솔 오류 0, 글자 대비 최소 4.81을 확인했습니다.
- 인쇄 PDF는 A4 가로 1쪽(841.92×594.96pt). 손기입 밑줄 학교 56.4mm·이름 65.3mm·쓰기 높이 11.9mm, PNG 2400×1697 저장본과 PDF 렌더를 직접 열어 확인했습니다. PNG 제목에도 실제 strokeText가 적용됩니다.
- 평소 등장 700ms·도장 500ms, OS/앱의 동작 줄이기에서는 애니메이션 0. 인증서에서 설정 열기/닫기·지도로 돌아간 뒤 완료 기록 보존도 확인했습니다.
- 공식 주소의 index·JS/CSS·서비스워커·인증서 테두리 7개 SHA-256이 검증 빌드와 모두 일치합니다. 기침 예절·지도 파이널 영상의 Range 요청은 206·100바이트 응답을 유지합니다. 검증 자료는 외장 SSD `_scratch/unfinished-audit-20261122/release-09/production/`와 같은 폴더의 해시 기록에 보관했습니다.
