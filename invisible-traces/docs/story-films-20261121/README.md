# 인트로·아웃트로 이야기 영상 (2026-11-21)

게임에 들어간 파일: `public/assets/story/intro-film.mp4`(23.7초, 5.0MB), `outro-film.mp4`(23.7초, 4.0MB), 포스터 `*-poster.jpg`.
재생: 진행 기록이 없을 때 「시작」을 누르면 인트로, P10을 처음 마칠 때 아웃트로(`src/story-film.js`, `src/main.ts` `playFilm`). 건너뛰기 가능, 소리 설정이 모두 꺼져 있으면 음소거, 동작 줄이기면 자동재생 안 함. 서비스워커 미리 받기에서 뺌(볼 때만 받음). 운영 배포 설정 `run_worker_first`에 `/assets/story/*`를 더해 206 Range로 보낸다.

## 장면별 출처

| 장면 | 첫 프레임(GPT 이미지, Codex `gpt-imagegen`) | 움직임 | 목소리(ElevenLabs `eleven_v4`) |
|---|---|---|---|
| I-1 아침 학교의 흔적 | `intro-1.png` | Google Flow, Veo 3.1 Fast, 프로젝트 `7a8d4688-034f-4185-8d40-8e81093e857f` | 기록 파트너 Sora `R57C1ECBzXRSHUbNYPYx`, 새 줄 requestId `uWxyaGGWa1L7QMnl3fIS` |
| I-2 자국 도깨비의 장난 | `intro-2.png` | Google Flow, Veo 3.1 Fast(같은 프로젝트) | 자국 도깨비 Deok su `IAETYMYM3nJvjnlkVTKI`, 새 줄 requestId `W8xmUjlWzBJqESOnObfD` |
| I-3 조사팀 출동 | `intro-3.png` | Gemini 앱 동영상 만들기(Veo), 채팅 `ca5a0a8252626875` | 기존 `el-title-1.mp3` |
| F-1 흔적의 주인 | `final-1.png` | **임시: ffmpeg 카메라 움직임(천천히 다가감)**. Flow 크레딧·Gemini 하루 한도 소진 | 기존 `el-villain-5-5.mp3` |
| F-2 생활 속 실천 | `final-2.png` | Gemini 앱 동영상 만들기(Veo), 채팅 `8c6097b98e143627` | 기존 `el-ending-2.mp3` |
| F-3 함께 지키는 학교 | `final-3b.png` | **임시: ffmpeg 카메라 움직임(뒤로 빠짐)**. 같은 이유 | 기존 `el-ending-1.mp3` |

- 배경음: 게임 배경음 `main-theme.mp3`(인트로), `final-theme.mp3`(아웃트로), Suno 유료(권리 장부 21줄). 영상 생성기 소리는 쓰지 않았다.
- 글자: 나눔스퀘어 네오 Bold(OFL, `public/fonts`)를 TTF로 바꿔 ffmpeg `drawtext`로 넣음. 제목 로고는 `title-logo.webp`.
- 워터마크: Flow·Gemini 영상 오른쪽 아래의 작은 Veo 표시가 남아 있다(이 계정 지역에서 끌 수 없음).
- 프롬프트: 그림 `prompts.json`, 영상 `page-prompts.json`. 콘티 페이지 https://claude.ai/artifact/KQMVKV3oAXT2jZjZedZNsQ

## F-1·F-3을 AI 영상으로 바꾸는 법

크레딧·한도가 풀리면 `final-1.png`·`final-3b.png`로 같은 프롬프트(`page-prompts.json`의 `video.final-1`, `video.final-3`)를 Flow나 Gemini에서 만든 뒤, 작업 폴더(`.tmp/video-keyframes-20261121/clips/F-1.mp4`, `F-3.mp4`)에 넣고 `python3 compose.py outro`를 다시 돌려 `public/assets/story/outro-film.mp4`를 바꾼다.
