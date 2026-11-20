# 보이지 않는 흔적

초등 3학년 과학 「감염병과 건강한 생활」을 위한 탐구 게임. 5스테이지·학습 10장으로 구성하고, 스테이지 선택 맵만 2.5D 픽셀아트 RPG로 표현한다.

## 현재 상태

**공개 배포·최종 기술 검증 완료(2026-11-11).** 타입 검사·빌드·회귀 테스트 51개가 통과했다. 13해상도·기본/큰 글자의 활동 754상태와 공통 화면·팝업 56상태에서 최종 문제 0건을 확인했다. 공개 URL에서도 메인→지도→P01~P10→엔딩·인증서·새로고침·재실험을 끝까지 검증했다. 점수는 9.1/10이며, 교사 콘텐츠 검수와 학교 실기기 확인을 조건으로 남겼다.

- [공개 게임](https://healthy-habits-quest.yelsam.workers.dev/)
- 최신 납품 점검(2026-11-20 운영 빌드 재점검, 조건부 배포 가능 92/100): [검토](invisible-traces/docs/reviews/RELEASE-REVIEW-20261120.md) · [점수](invisible-traces/docs/reviews/SCORE-20261120.md) · 이전 [2026-11-19 검토](invisible-traces/docs/reviews/RELEASE-REVIEW-20261119.md) · [2026-11-18 검토](invisible-traces/docs/reviews/RELEASE-REVIEW-20261118.md) · [놀이 화면 비율·중복 버튼 정리](invisible-traces/docs/LAYOUT-BALANCE-20261118.md)
- [최종 검토와 배포 증거](invisible-traces/docs/reviews/RELEASE-REVIEW-20261111.md) · [점수와 감점 근거](invisible-traces/docs/reviews/SCORE-20261111.md)
- 공개 URL과 로컬·미리보기 URL은 origin이 달라 탐구 기록이 각각 저장된다.

- 저장소: https://github.com/yelmovie/healthy-habits-quest
- [재개 메모와 알려진 미완료 작업](docs/WORK_STATUS.md)
- [PRD](docs/PRD.md) · [TRD](docs/TRD.md) · [장별 시나리오](docs/SCENARIO_DRAFT.md)
- [설계 데이터](docs/STAGE_CONTENT.json) · [설계 검증 결과](docs/DESIGN_VALIDATION.md)

## 개발

```bash
cd invisible-traces
npm ci
node "/Volumes/T7 Shield/DevMaintenance/add-native-binaries.mjs"   # 맥·윈도우 공용 node_modules일 때
npm run check    # 타입 검사
npm test         # 핵심 로직 회귀 테스트(node --test + tsx)
npm run dev      # 개발 서버
npm run build    # 타입 검사 + 빌드 + 오프라인 캐시 목록(precache-manifest.json)
npm run preview  # 빌드 결과 확인(서비스워커는 이때만 동작)
```

원본 image/와 files/는 로컬 참고 자료이고, 최적화한 게임 배경은 invisible-traces/public/assets/에 있다.

배경음은 Suno로 만든 2곡(사용자 제공)이다. 메인 테마(`public/assets/audio/bgm/main-theme.mp3`)는 첫 탭부터 홈·지도·활동 내내 반복하고, 파이널(`final-theme.mp3`)은 엔딩·인증서에서 한 번, 지도 파이널 영상 대화상자가 열린 동안 재생한다. 인물 목소리가 나오면 1/4로 줄어든다. 설정에서 「배경 음악」(켜기·끄기 + 크기)과 「효과음」(안내 목소리 포함)을 따로 켜고 끄며, 머리글 소리 버튼은 둘을 함께 켜고 끈다(2026-11-19, 예전 「소리 피드백」 저장값은 그대로 이어받는다). 원본은 `invisible-traces/references/suno`(Git 제외), 상업 이용 근거(Suno 유료 요금제)는 확인 필요. 출처 기록: [오디오 출처](invisible-traces/docs/AUDIO-PROVENANCE-20261109.md).

성취 카드(2026-11-18): 지도 악당을 세 번 맞혀 물리치면 퇴장 뒤 화면 가운데로 카드가 돌며 나타나고, 「카드 보관함에 넣기」를 누르면 지도 오른쪽 위 소리 버튼 앞 다섯 칸으로 들어간다. 장소 순서대로 별 1~5개이고 다섯 장을 모으면 「컬렉션 완성!」이 나온다. 칸을 누르면 보관함이 열린다. 가진 카드는 기존 격퇴 기록(`mapHits` 3타)에서 계산해 저장 형식은 그대로다. 카드나 보관함이 열린 동안 지도(걷기·키·악당)는 멈추고, 전체 격퇴 파이널 영상은 카드를 닫은 뒤에 나온다. 칸은 지도 화면에만 있다. 연결 코드는 `invisible-traces/src/reward-card-set.ts`이고, 연출 모듈 `src/reward-cards.js`·`src/reward-cards.css`는 과학34 공통 모듈(`_shared/reward-cards`)을 그대로 복사한 것이라 고치지 않는다.
