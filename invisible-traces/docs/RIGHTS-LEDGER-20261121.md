# 12 보이지 않는 흔적 · 권리 장부 (2026-11-21)

**요약: 29줄 = 확인됨 10줄 · 근거 약함 18줄 · 출처 미확인 1줄.** 파일 수로는 미디어 221개 = 확인됨 148개 · 근거 약함 72개 · 출처 미확인 1개(`assets/map-encounters/villain-left.png`, 코드에서 쓰지 않는 파일).

- 경로 기준: 앞에 아무것도 없는 경로는 `invisible-traces/` 기준, `../`로 시작하면 저장소 루트(`12 diseases/`) 기준, `_shared/`·`_scratch/`는 `iscreammedia_sc34/` 기준이다.
- 대상: 운영 빌드 `invisible-traces/dist`(2026-11-21 06:54 빌드)에 들어 있는 그림·영상·음악·효과음·목소리·글꼴 221개(`find dist -type f`, `._*` 제외). 코드·HTML·서비스 워커·캐시 목록은 빼고, Phaser 코드 안에 박힌 기본 그림만 한 줄로 넣었다.
- 상태 기준: **확인됨** = 저장소나 `_shared` 기록이 이 파일과 만든 도구·날짜·이용 조건을 함께 묶어 준다. **근거 약함** = 기록은 있지만 도구·날짜·이용 조건 중 하나 이상이 비었거나, 기록이 저장소 밖 작업 폴더(`_scratch`)에만 있다. **출처 미확인** = 이 파일과 출처를 잇는 기록을 찾지 못했다. 추측으로 채우지 않았다.
- 해시 대조(이번에 직접 계산): 효과음 17개, 목소리 126개, `npc-welcome.m4a`, 배경음 2곡(원본 `references/suno`와 같음), 2026-11-10·11-12·11-16·11-18 생성 그림 41개가 기록의 SHA-256과 모두 같다. 2026-11-08 그림 3개는 기록의 바이트 수와 `output/overnight-20261108/*.json`의 해시가 같다.
- 옛 배경 10장의 원본은 이번에 직접 대조했다: 배포 그림과 `image/chatgpt_generated_19~28.png`를 같은 크기(48×27 회색조)로 줄여 비교하면 짝마다 평균 차이 0.2~0.3, 다음으로 가까운 그림은 31 이상이다. 짝은 아래 1·2줄에 적었다.
- 앱 설정의 「정보」에 생성형 이미지 사용 고지가 있다(`docs/ASSET-PROVENANCE-20261108.md`, `docs/WORK_STATUS.md` 2026-10-29~30 절).

## 그림

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 1 | 옛 배경 중 지금 쓰는 5장(1440×810): `assets/school.webp`(19번, 첫 화면·지도 바탕), `classroom.webp`(23번, P01·P02 교실), `restored.webp`(28번, 엔딩 바탕), `pathlab.webp`(24번)·`comparison.webp`(26번, 연구 기록 「개념 세 장면」) | ChatGPT로 만든 그림으로 기록됨(원본 파일 이름 `chatgpt_generated_NN.png`). 크기 줄이기·WebP 변환만 함 | 원본 파일 날짜 2026-10-08. 기록: 「사용자가 제공한 공유 대화」 ChatGPT 공유 링크, 저장소 첫 커밋 `1d49fff`(2026-10-28) | 기록 없음(누구 계정·어느 요금제로 만들었는지, 업체 제공 자료인지 적힌 곳이 없음) | `../docs/SCENARIO_DRAFT.md` 10장 「에셋 판단」·「출처」, `../docs/PRD.md` 8장, 원본 `../image/chatgpt_generated_19~28.png`(Git 제외) | 근거 약함 |
| 2 | 옛 배경 중 코드에서 쓰지 않는 5장(1440×810): `condition.webp`(25번), `field.webp`(20번), `impact.webp`(22번), `lab.webp`(21번), `strategy.webp`(27번) | 1줄과 같음 | 1줄과 같음 | 1줄과 같음 | 1줄과 같음. `src`에서 이 이름으로 그림을 부르는 곳을 찾지 못함 | 근거 약함 |
| 3 | `assets/title-logo.webp`(1300×462, 제목 글자가 그림에 들어 있음) | 1줄과 같은 ChatGPT 그림 29번을 잘라 WebP로 | 2026-10-08 원본, 변환 `scripts/build-title-assets.cjs`, 커밋 `1366f3c`(2026-11-09) | 기록 없음 | `scripts/build-title-assets.cjs`, `../docs/SCENARIO_DRAFT.md` 10장 | 근거 약함 |
| 4 | `assets/title-hero.webp`(264×400), `title-mate.webp`(259×431) — 첫 화면 양쪽 인물 | 1줄과 같은 ChatGPT 그림 30번(캐릭터 시트)에서 잘라냄 | 2026-10-08 원본, 변환 `scripts/build-title-assets.cjs`, 커밋 `1366f3c` | 기록 없음 | `scripts/build-title-assets.cjs`, `../docs/IMAGE_PROMPTS.md`(시트에서 잘라 높이 400px이라고 적음) | 근거 약함 |
| 5 | `assets/school-map.webp`(1115×547) — 지도 | ChatGPT 그림 19번을 128색 픽셀 그림으로 변환 | 변환 `scripts/build-map-assets.cjs`, 커밋 `1366f3c`. 「새 생성 이미지는 쓰지 않았다」 | 기록 없음 | `scripts/build-map-assets.cjs`, `../docs/WORK_STATUS.md` 「조사 지도 고도화」 | 근거 약함 |
| 6 | `assets/map-team.webp`(192×58, 4칸) — 지도 걷는 두 인물 | ChatGPT 그림 30번에서 잘라 픽셀화, 다리만 뒤집어 걷기 칸을 만듦 | 변환 `scripts/build-map-assets.cjs`, 커밋 `1366f3c` | 기록 없음 | `scripts/build-map-assets.cjs` | 근거 약함 |
| 7 | `og-image.jpg`(1200×630) — 링크 미리보기 | 3·4줄 그림과 `school.webp`를 코드로 합성(새 그림 없음) | `scripts/build-og-image.cjs`, 커밋 `56b9e08`(2026-11-09) | 재료 그림(1·3·4줄)의 조건을 따름 | `scripts/build-og-image.cjs` | 근거 약함 |
| 8 | 2026-11-08 생성 3장: `water-glass-20261108.webp`, `cough-before-20261108.webp`, `cough-covered-20261108.webp` | `image_gen.imagegen`(Codex 기본 이미지 도구, 모델 이름은 도구가 알려 주지 않음). sharp로 크기·WebP만 | 2026-11-08. 프롬프트·원본 해시 `output/overnight-20261108/asset-provenance.json`, `cough-provenance.json`. 원본 `asset-bank/original/`(Git 제외) | ChatGPT 계정 요금제·이용 조건 기록 없음 | `docs/ASSET-PROVENANCE-20261108.md` | 근거 약함 |
| 9 | 2026-11-10 생성 3장: `gym-20261110.webp`, `meal-20261110.webp`, `cough-uncovered-20261110.webp` | `image_gen.imagegen` | 2026-11-10. 생성 조건·원본 해시는 문서, 배포 해시는 `docs/reviews/overnight-20261110/asset-verification.json`(일치). 원본은 당시 격리 작업 폴더 | 기록 없음 | `docs/ASSET-PROVENANCE-20261110.md` | 근거 약함 |
| 10 | 2026-11-12 생성 6장: `window-closed/open-20261112`, `serving-bowl-20261112`, `personal-plate-20261112`, `handwashing-20261112`, `hand-palm-20261112`(.webp) | `imagegen built-in` | 2026-11-12. 파일마다 프롬프트 요약·원본·해시. 원본 `asset-bank/original/education-20261112/` | 기록 없음 | `docs/ASSET-PROVENANCE-20261112.json` | 근거 약함 |
| 11 | 2026-11-16 생성 22장: `water-managed`, `node-book/ball/door`, `impact-self/others/school`, `plan-classroom/cafeteria/gym`, `bg-plaza/gym/classroom/cafeteria/field`, `rel-contact/environment/respiratory/meal`, `wash-palm/back/fingers`(모두 `-20261116.webp`) | `imagegen built-in (Codex, ChatGPT login)` | 2026-11-17 기록. 파일마다 프롬프트 요약·원본·해시. 원본 `asset-bank/original/flow-20261116/` | 기록 없음 | `docs/ASSET-PROVENANCE-20261116.json` | 근거 약함 |
| 12 | 성취 카드 10장: `reward-cards/card-1-0~5-4.webp`(640×960), `thumb-*.webp`(96×144) | `imagegen built-in (Codex, ChatGPT login)`, 게임 인물·배경을 참고 그림으로. 틀·별·글자는 코드 | 2026-11-18. 파일마다 프롬프트·원본·해시. 원본 `asset-bank/original/reward-cards-20261118/` | 기록에 「확인 필요: 생성 당시 ChatGPT 계정 이용 조건은 납품 때 대조」라고 적혀 있음 | `docs/ASSET-PROVENANCE-20261118.json`, `../docs/WORK_STATUS.md` 「2026-11-18 성취 카드」 | 근거 약함 |
| 13 | 대화 초상 2장: `dialogue/detective.webp`, `dialogue/recorder.webp`(1024×512, 입 모양 2칸) | 「GPT 기본 이미지 도구 5개 시트 → 9개 투명 2프레임 WebP」(10~13번 공통 작업) | 2026-11-12 작업, 커밋 `05fadfc`(2026-11-13). 파일별 프롬프트 없음. 기록이 저장소 밖에만 있음 | 기록 없음 | `_scratch/npc-10-13-20261112/HANDOFF.md`, `_scratch/dialogue-repair-portraits-20261114/REPORT.md` | 근거 약함 |
| 14 | 지도 전투 스프라이트 3장(지금 쓰는 것): `map-encounters/hero-redraw.png`, `ally-redraw.png`, `villain-redraw.png`(672×112, 6칸) | Codex 기본 이미지 도구, 운영 캐릭터를 참고 그림으로 | 2026-11-14, 커밋 `2d7299b`. 공통 프롬프트만 있음. 기록이 저장소 밖에만 있음 | 기록 없음 | `_scratch/redraw-12-15-20261114/README.md`, `_shared/MAP-VILLAINS-HANDOFF-20261114.md` 「신규 스프라이트 운영 배포」 | 근거 약함 |
| 15 | 옛 지도 스프라이트 2장(코드에서 안 씀): `map-encounters/hero.png`, `ally.png` | 「12–15 주인공·동료의 6컷은 기존 디자인을 유지한 변형 프레임」 — 재료는 4·6줄과 같은 인물 그림 | 커밋 `2cf1e52`(2026-11-14). 기록이 저장소 밖에만 있음 | 재료 그림의 조건을 따름(기록 없음) | `_scratch/map-encounters-12-16/DELIVERY.md`, `_shared/MAP-VILLAINS-HANDOFF-20261114.md` | 근거 약함 |
| 16 | `map-encounters/villain-left.png`(672×112) — 코드에서 안 씀(지금은 14줄 `villain-redraw.png`) | **기록 없음.** 넣은 스크립트(`_scratch/map-encounters-12-16/integrate.py`)는 경로만 연결하고, 이 그림을 무엇으로 그렸는지 적은 곳을 찾지 못함 | 커밋 `2cf1e52`(2026-11-14) | 기록 없음 | 없음 | **출처 미확인** |
| 17 | `favicon.svg` | 저장소 안에서 손으로 쓴 SVG(사각형·원·선 3개) | 첫 커밋 `1d49fff`(2026-10-28). 따로 적은 제작 기록 없음 | 기록 없음(도형 세 개뿐이라 위험은 낮음) | `public/favicon.svg` 내용 | 근거 약함 |
| 18 | Phaser 코드 안 기본 그림(`assets/phaser-*.js` 속 data URI 4개) | Phaser 라이브러리 | npm 패키지 | MIT | `node_modules/phaser/package.json` `"license": "MIT"` | 확인됨 |

## 영상

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 19 | 기침 예절 개념 영상: `cough-etiquette-film.mp4`, `.webm`, `cough-etiquette-film-poster.webp`(13.5초, 소리 없음) | 이 프로젝트에서 HyperFrames로 직접 렌더. 그림은 8줄 `cough-before/covered`와 4줄 `title-mate`, 글꼴은 나눔스퀘어 네오(OFL), 애니메이션 라이브러리 gsap | 2026-11-09, 커밋 `ab7d10c`. 기획·검수·렌더 수치 | 영상 자체는 직접 제작. 안에 든 그림은 8줄·4줄 조건을 따름 | `../films/cough-etiquette/SPEC.md`, `REVIEW.md`, `meta.json` | 근거 약함(재료 그림 때문) |
| 20 | 지도 파이널 영상: `map-encounters/map-finale.mp4`(6초, 소리 없음) | ffmpeg 스크립트로 게임 지도 화면 캡처(1280×800) 한 장에 확대·글자를 얹음. 글자는 macOS 시스템 글꼴 `AppleSDGothicNeo.ttc` | 2026-11-14, 커밋 `718f5ff`. 기록이 저장소 밖에만 있음 | 지도 그림(5·14줄)의 조건을 따름. 시스템 글꼴로 구운 글자의 배포 조건은 기록 없음 | `_scratch/stage-villain-dialogue/movies.py`, 캡처 원본 `_scratch/live-map-contact-review/originals/12-attack.png` | 근거 약함 |

## 음악

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 21 | 배경음 2곡: `audio/bgm/main-theme.mp3`, `final-theme.mp3` | Suno(사용자가 생성해 제공) | 2026-11-17. 프롬프트 `_shared/music-prompts-10-16.html`, 원본 `references/suno/main_theme.mp3`·`final.mp3`(Git 제외, 해시 같음) | Suno Premier 유료 요금제(2026-11-18 사용자 확인). 요금제 화면은 저장소에 없음 | `docs/AUDIO-PROVENANCE-20261109.md` 「배경음」, `_shared/voice-provenance-20261118.md` 「요금제」 | 확인됨 |

## 효과음

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 22 | 지도 전투·성공음 8개: `spray-hiss-03`, `bubble-02`, `hit-light-02`, `hit-heavy-02`, `villain-exit-04`, `villain-appear-01`, `hurt-bump-01`, `correct-01`(.mp3) | freesound.org(BeneGe, AlaskaRobotics, saturdaysoundguy, MATRIXXX_, javapimp, Faulkin), opengameart.org(rubberduck), kenney.nl(Kenney) — 파일마다 원본 주소 | 2026-11-17 추가, 원본 페이지 재확인 | CC0 | `docs/AUDIO-PROVENANCE-20261109.md` 「효과음 파일」(SHA-256 앞 16자 일치) | 확인됨 |
| 23 | 성취 카드 5개: `wind-whoosh-03`, `reward-01`, `reward-03`, `pickup-01`, `victory-jingle-01`(.mp3) | freesound.org(qubodup, ZenithInfinitiveStudios, CogFireStudios, DeltaCode, el_boss) | 2026-11-18 추가, 원본 페이지 2026-11-17 재확인 | CC0 | 같은 문서 「성취 카드 효과음」(해시 일치) | 확인됨 |
| 24 | 발자국·장소 열림 4개: `step-01`, `step-02`, `open-01`, `twinkle-03`(.mp3) | freesound.org(sgossner, Yoyodaman234, ZenithInfinitiveStudios), kenney.nl(Kenney Interface Sounds 1.0) | 2026-11-19 추가, 원본 페이지 2026-11-17 재확인 | CC0 | 같은 문서 「겹침 정리·지도 발자국·장소 열림 소리」(해시 일치) | 확인됨 |

파일이 없는 소리: 조작·탐색 소리 일부는 Web Audio로 코드에서 직접 합성한다(같은 문서 「이번 변경」). 외부 녹음·멜로디를 쓰지 않았다고 적혀 있다.

## 목소리

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 25 | 인물 대사·안내·개념 해설·악당 말풍선 84줄: `audio/voices/el-*.mp3`(아래 26줄 2개 제외) | ElevenLabs `eleven_v4`, 라이브러리 목소리 oki·Sora·Sara Kim·Deok su(실제 사람 복제 아님) | 2026-11-18. 줄마다 voiceId·generationId·글·ASR·음량·SHA-256 | Creator 유료 요금제(연간), 상업 이용 가능 — 기록과 사용자 확인 | `docs/VOICE-FILL-20261118.json`, `_shared/voice-provenance-20261118.md` 「요금제」 | 확인됨 |
| 26 | 첫 화면·홈 대사 2줄: `el-intro-1.mp3`, `el-title-1.mp3` | ElevenLabs `eleven_v4`, oki·Sora - versatile | 2026-11-12. 줄마다 generationId·SHA-256(일치) | 이 JSON에는 요금제 문구가 없음. `_shared` 기록에 「2026-11-17까지 생성분 Starter(유료), 사용자 확인」 | `docs/NPC-DIALOGUE-20261112.json`, `_shared/voice-provenance-20261118.md` | 확인됨 |
| 27 | 옛 Qwen 목소리 40개(코드에서 안 씀): `audio/voices/intro-1.mp3`, `title-1.mp3`, `p01-q.mp3` … `restore-3.mp3` | 로컬 모모(Momo)의 Qwen3-TTS-12Hz-1.7B-VoiceDesign 프리셋 목소리(실제 사람 아님) | 2026-11-10. 줄마다 모델·시드·UUID·ASR·SHA-256(일치) | Apache-2.0(Qwen3-TTS) | `docs/VOICE-PROVENANCE-20261110.json`, `docs/VOICE-FILL-20261118.json` `unusedOldFiles` | 확인됨 |
| 28 | 옛 환영 음성 `audio/npc-welcome.m4a`(코드에서 안 씀) | 모모 로컬 Supertonic 3, 목소리 F1 | 2026-11-07, UUID·원본/배포 SHA-256(일치) | OpenRAIL-M(사용 제한 조항 있음, CC0 아님). 원문 보관 | `docs/NPC-VOICE-PROVENANCE.json`, `docs/SUPERTONIC3-LICENSE.txt`, `docs/AUDIO-PROVENANCE-20261109.md` 「NPC 안내 음성」 | 확인됨 |

## 글꼴

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 29 | `fonts/NanumSquareNeoTTF-bRg.woff2`, `NanumSquareNeoTTF-cBd.woff2`(+ `NanumSquareNeo-OFL.txt`, `README.md`) | 네이버 나눔스퀘어 네오 공식 패키지, 고치지 않음 | 2026-11-10 내려받음. 받은 주소 README에 있음 | SIL Open Font License 1.1, 원문 동봉(글꼴 자체 판매만 금지) | `public/fonts/README.md`, `public/fonts/NanumSquareNeo-OFL.txt` | 확인됨 |

## 메모

- 납품본을 묶을 때 빼면 깔끔한 미사용 파일 49개: 2줄 5장, 15줄 2장, 16줄 1장, 27줄 40개, 28줄 1개. 빼도 화면은 바뀌지 않지만, 빼기 전에 빌드 JS·CSS에서 이름을 한 번 더 찾아 확인한다. 이 장부 작업에서는 지우지 않았다.
- 9줄 그림의 원본 PNG는 기록상 「격리 작업 폴더」에 있었고 지금 `asset-bank/original/`에는 없다. 해시 기록은 저장소 안에 있다.
- `_shared/voice-provenance-20261118.md`는 12번 `AUDIO-PROVENANCE-20261109.md`를 「지금 파일과 맞지 않는 낡은 기록」으로 적었다. 이 문서의 2026-11-18 절 이후는 지금 파일과 맞고, 앞쪽 2026-11-09 절(합성 효과음·Supertonic 환영 음성)은 그때 기록이다.
- 저장소 루트의 `../thumbnails/`(16×8·1×1 썸네일)과 `../image/`·`../files/` 원본은 운영 빌드에 들어가지 않아 이 장부에서 뺐다.

## 사용자가 줘야 하는 자료

1. **옛 ChatGPT 그림 30장의 출처**(1~7줄과 15·19·20줄의 재료): `../image/chatgpt_generated_01~30.png`를 만든 ChatGPT 대화가 누구 계정인지, 만든 날짜, 그때 요금제 화면. `SCENARIO_DRAFT.md`의 공유 대화 링크가 네 대화면 그 계정 화면이면 되고, 아이스크림미디어가 준 자료면 그 계약서나 메일. 이게 없으면 3-3단계에서 지금 쓰는 그림(1·3~7줄)을 새로 그려 바꿔야 한다.
2. **ChatGPT(Codex 이미지 도구) 요금제 화면**: 2026-11-08~11-18에 만든 그림(8~14줄)을 생성한 ChatGPT 계정의 요금제. 성취 카드 기록에 「확인 필요」로 남아 있다. 가능하면 그때 OpenAI 이용약관 원문 사본(저장 날짜 포함).
3. **ElevenLabs 요금제 화면이나 영수증**: 2026-11-12 생성분(Starter)과 2026-11-18 생성분(Creator 연간). 지금은 「사용자 확인」 문장만 있다.
4. **Suno Premier 요금제 화면이나 영수증**: 2026-11-17 배경음 생성 시점.
5. **`villain-left.png`(16줄)**: 만든 방법을 기억하거나 자료가 있으면 알려 줘. 없으면 쓰지 않는 파일이라 납품본에서 빼면 된다(새 그림 필요 없음).
6. (결정) **지도 파이널 영상 글자 글꼴**: macOS 시스템 글꼴로 구운 글자를 그대로 둘지, 나눔스퀘어 네오로 다시 구울지.
