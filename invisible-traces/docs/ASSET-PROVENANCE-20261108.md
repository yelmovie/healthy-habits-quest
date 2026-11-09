# 생성 이미지 출처 기록 (2026-11-08 추가분)

2026-11-08 밤 작업에서 새로 만든 이미지 3장의 출처를 저장소 안에 남긴다. 원본 검토 문서(`output/overnight-20261108/REVIEW.md`, `COUGH_REVIEW.md`)는 작업 폴더의 추적되지 않는 산출물이라, 배포본과 함께 다니는 기록이 따로 필요했다. 2026-11-09 고도화 작업에서 그 두 문서의 사실만 옮겨 적었다.

| 사용본 | 크기 | 쓰는 곳 | 생성 방법 | 원본(저장소 밖) |
|---|---|---|---|---|
| `public/assets/water-glass-20261108.webp` | 600×657, 42,116바이트, 알파 | P06 물 출처 비교 두 카드(같은 그림) | image_gen.imagegen, 투명 배경 물컵 한 개, 글자·로고·얼굴 없음 | `asset-bank/original/water-glass-20261108.png` |
| `public/assets/cough-before-20261108.webp` | 427×640, 32,470바이트, 알파 | P06 비말 실험(가리기 전), 함께 있는 친구 | image_gen.imagegen, 같은 학생·옷·오른쪽 방향 | `asset-bank/original/cough-before-20261108.png` |
| `public/assets/cough-covered-20261108.webp` | 427×640, 30,954바이트, 알파 | P06 비말 실험(가린 뒤), 연구 기록 개념 장면 | 위 사용본을 참조해 옷소매로 입·코를 가린 자세만 바꿈 | `asset-bank/original/cough-covered-20261108.png` |

- 정확한 내부 모델 ID는 생성 도구 응답에 없었다. 특정 모델로 만들었다고 주장하지 않는다.
- 원본 PNG는 덮어쓰지 않았고, 설치된 sharp로 크기 조정·WebP 변환만 했다.
- 옷소매 가림은 행동을 분명히 보여 주는 그림이며, 팔꿈치 안쪽의 정확한 해부학적 위치를 재현했다고 주장하지 않는다.
- 그 밖의 배경·캐릭터·지도 그림의 출처는 `../docs/WORK_STATUS.md`, 효과음은 `AUDIO-PROVENANCE-20261109.md`, 안내자 음성은 `NPC-VOICE-PROVENANCE.json`에 있다.
- 앱 설정의 "정보"에 생성형 이미지 사용 고지가 있다.
