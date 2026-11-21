# 인트로·아웃트로 이야기 영상 (2026-11-21)

게임에 들어간 파일: `public/assets/story/intro-film.mp4`(23.7초, 5.0MB), `outro-film.mp4`(23.7초, 4.0MB), 포스터 `*-poster.jpg`.
재생: 진행 기록이 없을 때 「시작」을 누르면 인트로, P10을 처음 마칠 때 아웃트로(`src/story-film.js`, `src/main.ts` `playFilm`). 건너뛰기 가능, 소리 설정이 모두 꺼져 있으면 음소거, 동작 줄이기면 자동재생 안 함. 서비스워커 미리 받기에서 뺌(볼 때만 받음). 운영 배포 설정 `run_worker_first`에 `/assets/story/*`를 더해 206 Range로 보낸다.

## 장면별 출처

| 장면 | 첫 프레임(GPT 이미지, Codex `gpt-imagegen`) | 움직임 | 목소리(ElevenLabs `eleven_v4`) |
|---|---|---|---|
| I-1 아침 학교의 흔적 | `intro-1.png` | Google Flow, Veo 3.1 Fast, 프로젝트 `7a8d4688-034f-4185-8d40-8e81093e857f` | 기록 파트너 Sora `R57C1ECBzXRSHUbNYPYx`, 새 줄 requestId `uWxyaGGWa1L7QMnl3fIS` |
| I-2 자국 도깨비의 장난 | `intro-2.png` | Google Flow, Veo 3.1 Fast(같은 프로젝트) | 자국 도깨비 Deok su `IAETYMYM3nJvjnlkVTKI`, 새 줄 requestId `W8xmUjlWzBJqESOnObfD` |
| I-3 조사팀 출동 | `intro-3.png` | Gemini 앱 동영상 만들기(Veo), 채팅 `ca5a0a8252626875` | 기존 `el-title-1.mp3` |
| F-1 흔적의 주인 | `final-1.png` | Google Flow, Veo 3.1 Fast(같은 프로젝트), 기본 계정(화면 표시 PRO), 2026-11-21 15:00 KST, 크레딧 28 → 8 | 기존 `el-villain-5-5.mp3` |
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

- 2026-11-21 15:38: F-3을 Gemini 앱 영상으로 바꿨다(앱 커밋 `2265fef`, Worker `2ec29e1d`). 이제 임시 장면은 없다. 보조 계정은 쓰지 않았다(보조 1은 그때 Flow 첫 이용 동의 화면, 보조 2는 Flow 크레딧 12로 Veo 3.1 Fast 20에 모자람).

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
