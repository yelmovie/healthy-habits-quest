# 보이지 않는 흔적

초등 3학년 과학 「감염병과 건강한 생활」을 위한 탐구 게임. 5스테이지·학습 10장으로 구성하고, 스테이지 선택 맵만 2.5D 픽셀아트 RPG로 표현한다.

## 현재 상태

**공개 배포·최종 기술 검증 완료(2026-11-11).** 타입 검사·빌드·회귀 테스트 51개가 통과했다. 13해상도·기본/큰 글자의 활동 754상태와 공통 화면·팝업 56상태에서 최종 문제 0건을 확인했다. 공개 URL에서도 메인→지도→P01~P10→엔딩·인증서·새로고침·재실험을 끝까지 검증했다. 점수는 9.1/10이며, 교사 콘텐츠 검수와 학교 실기기 확인을 조건으로 남겼다.

- [공개 게임](https://healthy-habits-quest.yelsam.workers.dev/)
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
