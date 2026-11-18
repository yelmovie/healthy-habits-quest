# 오디오 출처와 개선 기록

2026-11-09 작업 기록. 커밋·외부 배포·기존 파일 삭제 없음.

## 이번 변경

보이지 않는 흔적: 차분한 유리 음색의 조작·탐색·기록 완성 3종을 Web Audio로 직접 합성합니다. 질병을 공포로 표현하는 경보·기침 녹음은 추가하지 않았습니다.

효과음 신규 합성 코드는 이 프로젝트에서 작성했으며 외부 녹음이나 멜로디를 복제하지 않았습니다. 기존 CC0 음원의 원본 라이선스·출처 문서는 그대로 보존합니다. CC0 자산과 앱 자체의 저작권 조건을 혼동하지 않습니다.

## 캐릭터 음성 · 2026-11-18

- 인물 대사·안내·개념 해설·지도 악당 말풍선은 모두 ElevenLabs `eleven_v4`(유료 Creator 요금제, 상업 이용 가능)로 만든 MP3다. 캐릭터 한 명에 목소리 하나: 과학 조사원(관찰 담당) = oki, 기록 파트너(기록 담당) = Sora, 현장 선생님 = Sara Kim, 자국 도깨비 = Deok su. 실제 사람 음성 복제가 아니다.
- 아래 Momo/Supertonic 환영 음성과 2026-11-10 Qwen3-TTS 대사 파일은 더 이상 재생하지 않는다(파일 보존). 줄별 voiceId·requestId·ASR·음량·SHA256은 `VOICE-FILL-20261118.json`.

## NPC 안내 음성

- 기존 파일: `public/assets/audio/npc-welcome.m4a`
- SHA-256: `0e365071d44d3ede442e84debce6f6b6312104ab5dd3ad6b6b7b0090776d9133`
- 기존 제작 기록은 Momo/Supertonic 한국어 환영 음성으로 설명합니다. 이번 작업에서 새 음성을 생성하거나 음성을 복제하지 않았습니다.
- Supertonic 3 공식 모델 조건: https://huggingface.co/Supertone/supertonic-3/blob/main/LICENSE (OpenRAIL-M). 출력에 관한 6항 및 이용 제한을 따라야 하며 CC0/무저작권으로 표기하지 않습니다.
- 생성 UUID·원본 WAV 및 배포 M4A SHA-256, 생성 시각, 음성 F1, 한국어 대본을 `NPC-VOICE-PROVENANCE.json`에 기록했습니다. 실제 Chrome 디코딩 후 길이 일치, 파형 상관계수 0.998 이상, 화면 자막 완전 일치를 확인했습니다. 원본 OpenRAIL-M 라이선스 전문은 `SUPERTONIC3-LICENSE.txt`에 보존했습니다.
- macOS say를 사용하지 않았고 시스템 음성의 상업적 재배포 권리를 주장하지 않습니다. 마이크·음성 인식·외부 TTS 요청을 추가하지 않았습니다.

## 동작과 범위

사용자가 재생을 누를 때만 NPC가 말합니다. 자막을 유지하며 정지·숨김·닫기/화면 해제 시 재생을 중단합니다. 기존 저장된 소리 설정을 유지합니다. NPC 음성은 홈 환영 1개이며 전체 수업 대사를 녹음한 것이 아닙니다.

## 확인

프로젝트 `npm test`, `npm run build` 통과. 실제 Chrome에서 네 프로젝트 NPC 재생 진행·수동 정지·탭 숨김을 확인했습니다. 10~12번 대화창 닫기도 확인했습니다. JS 오류는 0건입니다. 실제 사람의 청취 품질 판정, iPad/Safari·학교 기기의 오디오 검증은 수행하지 않았습니다.

## 배경음 (2026-11-17 추가)

| 자산 | 사용 위치 | 출처 | 비고 |
| --- | --- | --- | --- |
| 배경음 2곡 (Suno 생성) | audio/bgm/main-theme.mp3 (첫 탭부터 홈·지도·활동 반복), audio/bgm/final-theme.mp3 (엔딩·인증서 1회, 지도 파이널 영상 대화상자가 열린 동안) | 2026-11-17 사용자가 Suno로 생성해 제공. 프롬프트는 _shared/music-prompts-10-16.html | 원본은 invisible-traces/references/suno 보관(Git 제외). 상업 이용 근거: 생성 당시 Suno Premier 유료 요금제(2026-11-18 사용자 확인) |

인물 목소리가 나오는 동안 배경음은 1/4로 줄어든다. 소리 피드백을 끄거나 탭을 숨기면 멈춘다. 지도 파이널 영상은 계속 무음이다.

## 효과음 파일 (2026-11-17 추가)

과학34 공통 라이브러리(`_shared/sfx-library-20261117`, 모두 CC0 재확인)에서 감염병 단원에 맞게 겁주지 않는 소리(세정 분무·비누 거품·맑은 차임)만 골라 복사했다. 가공은 앱 안의 음량·재생 속도 조절뿐이다. 조작음(tap)과 탐색음(scan)은 기존 합성음을 그대로 쓰고, 파일을 못 읽으면 각 소리도 합성 차임으로 대신한다.

| 파일 | 사용 위치 | 원본 · 제작자 | 라이선스 | SHA-256 앞 16자 |
| --- | --- | --- | --- | --- |
| `audio/sfx/spray-hiss-03.mp3` | 지도 공격 시작(손소독 분무) | cleaning-spray-single-l-stereo.flac · BeneGe (https://freesound.org/people/BeneGe/sounds/453179) | CC0 (원본 페이지 재확인) | `843e096a230a29b0` |
| `audio/sfx/bubble-02.mp3` | 지도 1타 명중 | bubble_02 · rubberduck (https://opengameart.org/content/40-cc0-water-splash-slime-sfx) | CC0 (원본 페이지 재확인) | `c3bc83266b353f15` |
| `audio/sfx/hit-light-02.mp3` | 지도 2타 명중(재생 속도 0.92) | cartoon pop or drip · AlaskaRobotics (https://freesound.org/people/AlaskaRobotics/sounds/221091) | CC0 (원본 페이지 재확인) | `794b3447b6fd7b23` |
| `audio/sfx/hit-heavy-02.mp3` | 지도 3타 명중 | Loud Pillow Hit 2.wav · saturdaysoundguy (https://freesound.org/people/saturdaysoundguy/sounds/388035) | CC0 (원본 페이지 재확인) | `a1c26243b5a77780` |
| `audio/sfx/villain-exit-04.mp3` | 악당 퇴장(3타 230ms 뒤) | Sparkling Star 01.wav · MATRIXXX_ (https://freesound.org/people/MATRIXXX_/sounds/462095) | CC0 (원본 페이지 재확인) | `820f745f038dc1bb` |
| `audio/sfx/villain-appear-01.mp3` | 새 악당 첫 등장(새 기록 직후 한 번) | Pop 5.ogg · javapimp (https://freesound.org/people/javapimp/sounds/439186) | CC0 (원본 페이지 재확인) | `b0fb8b57cabe178a` |
| `audio/sfx/hurt-bump-01.mp3` | 아군 접촉 움찔(둘 다 닿아도 한 번) | LowHit_01.wav · Faulkin (https://freesound.org/people/Faulkin/sounds/336495) | CC0 (원본 페이지 재확인) | `9b67e7d2c5debc8c` |
| `audio/sfx/correct-01.mp3` | 기록 완성·활동 완료 성공음(기존 합성 차임 대체, 실패 시 합성음) | confirmation_001 · Kenney (https://kenney.nl/assets/interface-sounds) | CC0 (원본 페이지 재확인) | `287d54966793603e` |

모든 악당 격퇴 뒤 승리 징글은 넣지 않았다. 지도 파이널 영상 대화상자가 열리면 파이널 배경음이 바로 시작되어 겹치기 때문이다. 효과음은 기존 소리 설정(끄면 무음)·인물 목소리 재생 중 정지·탭 숨김 정지를 그대로 따른다.

## 성취 카드 효과음 (2026-11-18 추가)

지도 악당을 물리치고 받는 성취 카드의 소리다. 같은 공통 라이브러리(`_shared/sfx-library-20261117`)에서 그대로 복사했고(재인코딩 없음), 가공은 앱 안의 음량 조절뿐이다. 다른 효과음과 같은 재생기(`src/audio.ts`의 `createResearchAudio`)로 내므로 소리 설정·인물 목소리 중 정지·탭 숨김 정지를 그대로 따른다. 앞 소리(악당 퇴장, 카드 등장)를 끊지 않고 겹쳐 낸다.

| 파일 | 사용 위치 | 원본 · 제작자 | 라이선스 | SHA-256 앞 16자 |
| --- | --- | --- | --- | --- |
| `audio/sfx/wind-whoosh-03.mp3` | 카드가 날아올 때, 칸으로 날아갈 때 | Slow Swosh 40 · qubodup (https://freesound.org/people/qubodup/sounds/60027) | CC0 (원본 페이지 2026-11-17 재확인) | `35286e952e795b77` |
| `audio/sfx/reward-01.mp3` | 카드 공개(별 1~3개) | Fantasy_ui_Button_3.wav · ZenithInfinitiveStudios (https://freesound.org/people/ZenithInfinitiveStudios/sounds/376745) | CC0 (원본 페이지 2026-11-17 재확인) | `b359edf4f8e226f6` |
| `audio/sfx/reward-03.mp3` | 카드 공개(별 4~5개: 홀로·레전드) | Achievement Happy Beeps Jingle · CogFireStudios (https://freesound.org/people/CogFireStudios/sounds/619838) | CC0 (원본 페이지 2026-11-17 재확인) | `009f9d63c7daeec4` |
| `audio/sfx/pickup-01.mp3` | 카드가 칸에 도착 | item-pickup-v1.wav · DeltaCode (https://freesound.org/people/DeltaCode/sounds/678384) | CC0 (원본 페이지 2026-11-17 재확인) | `7c6fa70aee7b6886` |
| `audio/sfx/victory-jingle-01.mp3` | 다섯 장 완성 축하 | Game Success Fanfare Short · el_boss (https://freesound.org/people/el_boss/sounds/677858) | CC0 (원본 페이지 2026-11-17 재확인) | `0c28c5d2c984b207` |

다섯 장 완성 징글은 전체 격퇴 파이널 영상보다 먼저(카드 축하 화면에서) 난다. 축하를 닫아 파이널 대화상자가 열리면 효과음을 끊어 파이널 배경음과 겹치지 않게 했다.
