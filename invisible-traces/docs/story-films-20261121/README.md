# 인트로·아웃트로 이야기 영상 (2026-11-21)

게임에 들어간 파일: `public/assets/story/intro-film.mp4`(23.7초, 5.0MB), `outro-film.mp4`(23.7초, 4.0MB), 포스터 `*-poster.jpg`.
재생: 진행 기록이 없을 때 「시작」을 누르면 인트로, P10을 처음 마칠 때 아웃트로(`src/story-film.js`, `src/main.ts` `playFilm`). 건너뛰기 가능, 소리 설정이 모두 꺼져 있으면 음소거, 동작 줄이기면 자동재생 안 함. 서비스워커 미리 받기에서 뺌(볼 때만 받음). 운영 배포 설정 `run_worker_first`에 `/assets/story/*`를 더해 206 Range로 보낸다.

## 장면별 출처

| 장면 | 첫 프레임(GPT 이미지, Codex `gpt-imagegen`) | 움직임 | 목소리(ElevenLabs `eleven_v4`) |
|---|---|---|---|
| I-1 아침 학교의 흔적 | `intro-1.png` | Google Flow, Veo 3.1 Fast, 프로젝트 `7a8d4688-034f-4185-8d40-8e81093e857f` | 기록 파트너 Sora `R57C1ECBzXRSHUbNYPYx`, 새 줄 requestId `uWxyaGGWa1L7QMnl3fIS` |
| I-2 자국 도깨비의 장난 | `intro-2.png` | Google Flow, Veo 3.1 Fast(같은 프로젝트) | 자국 도깨비 Deok su `IAETYMYM3nJvjnlkVTKI`, 새 줄 requestId `W8xmUjlWzBJqESOnObfD` |
| I-3 조사팀 출동 | `intro-3.png` | Gemini 앱 동영상 만들기(Veo), 채팅 `ca5a0a8252626875` | 기존 `el-title-1.mp3` |
| F-1 흔적의 주인 | `final-1.png` | **지금은 임시 판**(장면 그림 + ffmpeg 카메라 움직임). 15:00에 기본 계정 Flow Veo 3.1 Fast로 만든 판은 도깨비 가면이 바뀌어 16시 마무리에서 뺐다 | 기존 `el-villain-5-5.mp3` |
| F-2 생활 속 실천 | `final-2.png` | Gemini 앱 동영상 만들기(Veo), 채팅 `8c6097b98e143627` | 기존 `el-ending-2.mp3` |
| F-3 함께 지키는 학교 | `final-3b.png` | Gemini 앱 동영상 만들기(Veo), 주 계정(화면 표시 PRO, 사용자 확인 유료), 채팅 `ba28460688c7b466`, 2026-11-21 15:38 KST | 기존 `el-ending-1.mp3` |

- 배경음: 게임 배경음 `main-theme.mp3`(인트로), `final-theme.mp3`(아웃트로), Suno 유료(권리 장부 21줄). 영상 생성기 소리는 쓰지 않았다.
- 글자: 나눔스퀘어 네오 Bold(OFL, `public/fonts`)를 TTF로 바꿔 ffmpeg `drawtext`로 넣음. 제목 로고는 `title-logo.webp`.
- 계정: 모든 Flow 장면은 지금까지 기본 계정으로 만들었다(보조 계정은 쓰지 않음).
- 워터마크: Flow·Gemini 영상 오른쪽 아래의 작은 Veo 표시가 남아 있다(이 계정 지역에서 끌 수 없음).
- 프롬프트: 그림 `prompts.json`, 영상 `page-prompts.json`. 콘티 페이지 https://claude.ai/artifact/KQMVKV3oAXT2jZjZedZNsQ

## F-1·F-3을 AI 영상으로 바꾸는 법

- 2026-11-21 15:00: F-1을 Flow 영상으로 바꿨다(앱 커밋 `751eff2`, Worker `3f8c5a50`). 도깨비 가면이 귀가 뾰족한 얼굴처럼 조금 바뀌는데, 인트로 I-2(Flow)에서도 같은 모습이라 영상 안에서는 이어진다. 

크레딧·한도가 풀리면 `final-1.png`·`final-3b.png`로 같은 프롬프트(`page-prompts.json`의 `video.final-1`, `video.final-3`)를 Flow나 Gemini에서 만든 뒤, 작업 폴더(`.tmp/video-keyframes-20261121/clips/F-1.mp4`, `F-3.mp4`)에 넣고 `python3 compose.py outro`를 다시 돌려 `public/assets/story/outro-film.mp4`를 바꾼다.

- 2026-11-21 15:38: F-3을 Gemini 앱 영상으로 바꿨다(앱 커밋 `2265fef`, Worker `2ec29e1d`). (16시 마무리에서 F-1은 인물이 바뀌어 다시 임시 판으로 돌렸다 — 아래 「최종 마무리」.) 보조 계정은 쓰지 않았다(보조 1은 그때 Flow 첫 이용 동의 화면, 보조 2는 Flow 크레딧 12로 Veo 3.1 Fast 20에 모자람).

- 2026-11-21 19:16~20:30: F-1을 보조 계정 2(`u/1`, 사용량 0%) Gemini 앱으로 세 번 다시 시도했으나 1·2회차는 「unusually high traffic … at full capacity」, 3회차는 15분 뒤에도 영상이 없었다(채팅 `fea9a156…`, `b0924da3…`, `aba0fa62…`). 앞서 보조 계정 3에서도 오류·몰림으로 실패. **F-1은 임시 판으로 남는다.**

- 2026-11-22 06:12·06:23(아침 예약 실행, 한 번으로 끝): 사용량이 가장 낮은 보조 계정 1(`u/2`, 사용량 0%) Gemini 앱으로 F-1을 두 번 보냈으나 둘 다 영상이 나오지 않았다. 1회차 「Sorry, something went wrong. Please try your request again.」(채팅 `3c7e323e4ab7ccf9`), 5분 뒤 2회차 「I'm having a hard time fulfilling your request. Can I help you with something else instead?」(채팅 `d44c9886310dc9fd`). 그때 사용량은 보조 2 42%, 보조 1·3 0%, 주 계정 1%. 다시 예약하지 않았고 **F-1은 임시 판 그대로다**(운영 영상·앱 변경 없음).

## 제미나이 앱(동영상 만들기·Veo)으로 장면 만드는 순서 (다른 프로젝트도 그대로)

Flow 크레딧과 따로 세는 계정별 Gemini 앱 사용량을 쓴다. 브라우저가 하나라 `fc-flow` 잠금 안에서 한 번에 한 장면씩. 예시 스크립트는 `gemini/` 폴더(`aside repl --file`로 실행).

1. **여는 주소:** `https://gemini.google.com/app`(주 계정). 보조 계정은 `https://gemini.google.com/u/1/app`·`/u/2/app`처럼 순번으로 연다(순번은 바뀔 수 있으니 왼쪽 아래 계정 표시를 확인, 주소 전체는 어디에도 적지 않는다).
2. **동영상 도구:** 입력칸 왼쪽 「업로드 및 도구」 → 「동영상 만들기」. 클릭 뒤 체크 표시 확인에서 오류가 나도 입력칸 위에 「동영상」 칩이 생기면 켜진 것이다(`VIDEO-MODE`로 확인).
3. **그림 올리기:** 다시 「업로드 및 도구」 → 「파일 업로드」 → 파일 선택 창(`filechooser`)에 그림을 넣는다. Aside REPL의 `fs`는 자기 세션 폴더(내장)만 읽으므로, 외장 SSD의 그림 폴더를 `python3 -m http.server 4499 --bind 127.0.0.1`로 띄우고 REPL `fetch`로 받아 `setFiles({name, mimeType, buffer})`로 넣는다(내장에 복사하지 않는다).
4. **프롬프트:** 「Gemini 프롬프트 입력」 칸에 영상 프롬프트를 넣고 보내기. 15초쯤 뒤 주소가 `…/app/<채팅 id>`로 바뀌고 "I'm generating your video"가 보이면 시작된 것. 주소가 `/app` 그대로면 안 보내진 것이니 한 번만 다시.
5. **받기:** 2~4분 뒤 그 채팅을 열면 `<video>`의 `currentSrc`가 `https://contribution.usercontent.google.com/download?...&filename=video.mp4` 형태로 생긴다. REPL `fetch(src)`로 받아 127.0.0.1 전용 수신기(`gemini/receive.py`)로 POST해 외장 SSD에 저장한다. 결과는 1280×720, 24fps, 약 10초(합성할 때 앞 7.9초만 씀).
6. **한도 안내가 보이는 자리:** 보낸 뒤 답 자리에 "I can create more videos as soon as your limit resets. Check your usage in Settings."가 나오면 그 계정은 끝. 풀리는 시각은 `https://gemini.google.com/usage`(설정 → 사용량 한도)에 「오후 3:19에 초기화」처럼 보인다(5시간 단위 공통 사용량, 날짜·시간대 표시는 없음). 2026-11-21 주 계정은 두 편(I-3·F-2) 뒤 한도가 찼다.
7. **한도 상태(2026-11-21 15:40, `…/usage`에서 읽음):** 주 계정 5시간 사용량 19%(오후 8:19 초기화, 주간 6%), `u/1` 0%(오후 6:17 초기화, 주간 6%), `u/2` 0%(오후 7:02 초기화, 주간 0%). 순번이 어느 보조 계정인지는 열 때마다 계정 표시로 다시 확인한다.
8. **확인:** 프레임을 뽑아 인물·글자·화풍을 직접 본다. 오른쪽 아래 작은 Veo 표시는 Flow와 같은 방식으로 남는다.

## 최종 마무리 (2026-11-21 16~17시, `_shared/FILMS-FINISH-20261121.md`)

앱 커밋 `b75e609`, Worker `bb8a41ac`. 재현 파일: `finish/compose2.py`(합성), `finish/intro.json`·`final.json`(자막 큐, `_shared/caption-motion-20261118/burn.py` 입력), `finish/*-motion.ass`(모션그래픽).

**이야기**
- 인트로(25.0초) — 눈길: 해 뜨는 학교 위로 흔적 빛 / 수수께끼: 자국 도깨비가 공·물병·책·문손잡이에 손자국을 남기고 숨는다(무엇이 어떻게 옮았는지는 말하지 않음) / 초대: 「우리 학교에 남은 흔적을 찾아 줘!」 → 제목 로고 + 「흔적은 어디에서 시작됐을까?」 → 지도로.
- 파이널(26.5초) — 해결: 도깨비가 지도를 돌려주고 흔적이 사라진다 / 달라진 세계: 창문 열기·손 씻기·옷소매 기침·덜어 먹기 / 축하: 조사원 「해냈어요! … 고마워요!」, 흔적 빛 색 꽃가루, 제목 로고, 「학교 과학 조사 완료!」 도장 → 인증서로.
- 장면: 실제 영상 5(I-1·I-2 Flow, I-3·F-2·F-3 Gemini) + 임시 판 1(F-1). F-1 Flow 영상은 도깨비 흰 가면이 연둣빛 얼굴로 바뀌어(다른 장면·지도 그림과 다름) 「장면 사이에 인물이 바뀌지 않는다」 기준에 따라 쓰지 않고, 장면 그림에 카메라 움직임만 준 판을 썼다. Gemini로 두 번 다시 시도했으나 한도(주 계정)·오류(보조 계정 1)·결과 없음(보조 계정 2)이었다. 2026-11-22 아침에 보조 계정 1로 두 번 더 보냈지만 오류 문구만 나와 임시 판을 유지했다.

**자막과 목소리(글자 그대로 일치)**

| 시점 | 화자(목소리) | 자막 = 대사 | 음원 | 원래 음량 → 영상 안 |
|---|---|---|---|---|
| 인트로 0.8초 | 기록 파트너(Sora `R57C1ECBzXRSHUbNYPYx`) | 어느 아침, 우리 학교에 이상한 흔적이 생겼어요. | 새 녹음 `uWxyaGGWa1L7QMnl3fIS` | -20.8 → -16.5 LUFS |
| 인트로 8.3초 | 자국 도깨비(Deok su `IAETYMYM3nJvjnlkVTKI`) | 킥킥, 내 손자국은 아무도 못 찾을걸! | 새 녹음 `W8xmUjlWzBJqESOnObfD` | -20.3 → -16.5 |
| 인트로 15.6초 | 기록 파트너 | 우리 학교에 남은 흔적을 찾아 줘! | 앱 `el-title-1` | -19.5 → -16.5 |
| 파이널 0.9초 | 자국 도깨비 | 흥, 지도를 돌려줄게. 낙서는 이제 내 수첩에만! | 앱 `el-villain-5-5` | -16.5 → -16.5 |
| 파이널 7.9초 | 기록 파트너 | 손 씻기·기침 예절·환기·덜어 먹기는 생활에서 모두 함께 실천해요. | 앱 `el-ending-2` | -16.7 → -16.5 |
| 파이널 15.2초 | 기록 파트너 | 우리의 발견이 학교를 바꿨어요. | 앱 `el-ending-1` | -16.4 → -16.5 |
| 파이널 18.0초 | 과학 조사원(oki `IQt4I2Udet4gAwcFGAlU`) | 해냈어요! 함께한 덕분에 숨은 흔적을 모두 밝혀냈어요. 고마워요! | 새 녹음 `wgTfDYsGiqzWuQp6ATyk` | -21.0 → -16.5 |

- 영상 전체 소리: 인트로 -15.6 LUFS(최고 -0.5 dBFS), 파이널 -15.6 LUFS(최고 -2.7 dBFS). 소리 트랙은 대사만이다(영상 생성기 소리·곡 없음).
- 새 녹음 받아쓰기 확인은 못 했다(API 키에 speech_to_text 권한 없음, 로컬 Whisper 없음). 자막 글은 녹음에 넣은 문장 그대로다.
- 반말로 먼저 녹음한 조사원 줄(`r0C22zBf7SDwIdz5RA8h`)은 앱 조사원 어조(「-요」)와 달라 쓰지 않았다.

**모션그래픽(ffmpeg + libass)**: 장면 사이 0.45초 교차 페이드, 시작 페이드(인트로 검정·파이널 흰색), 끝 정지 화면에 앱 제목 그림 `title-logo.webp`가 내려오며 나타남. 인트로 끝 흔적 빛 반짝임 + 호기심 한 줄, 파이널 끝 꽃가루 64조각 + 반짝임 + 도장 팝. 자막은 1~8번과 같은 `burn.py`(주아체 OFL, 이름표·말 속도 스윕·[키워드] 연두 강조·진행 줄). Veo 표시는 그대로.

**앱에서 뜨는 방식**: 전체 화면(100dvw×100dvh, 검정, contain), 오른쪽 위 「건너뛰기」 48px(끝나면 「계속하기」), 아래 조작 막대 없음(영상을 누르면 멈춤·이어 보기). 인트로는 진행 기록이 없을 때 「시작」에서 한 번, 파이널은 P10을 처음 마칠 때 한 번. 다시 보기: 설정 「앱 정보」(인트로, P10을 마쳤으면 파이널), 엔딩 카드 「파이널 영상 다시 보기」. 목소리 끔 → 영상 음소거(자막은 영상 안), 배경 음악은 평소대로. 목소리 켬 → 배경 음악을 대사 동안 낮춤. 동작 줄이기 → 자동재생 없이 「화면을 누르면 영상이 재생돼」. 뒤로 가기는 열린 영상을 먼저 닫는다. 영상이 안 열려도 「계속하기」로 진행. 서비스워커 미리 받기에서 빼고 Range 206.
