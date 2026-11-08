# 보이지 않는 흔적

초등 3학년 과학 「감염병과 건강한 생활」을 위한 탐구 게임. 5스테이지·학습 10장으로 구성하고, 스테이지 선택 맵만 2.5D 픽셀아트 RPG로 표현한다.

## 현재 상태

**납품 전 점검 단계(2026-10-30).** 타입 검사·빌드·회귀 테스트 13개가 통과하고, 메인→지도→P01~P10→엔딩·인증서까지 실제 브라우저에서 끝까지 플레이해 확인했다. 대표 해상도(1920×1080, 1366×768, 1280×800, 1280×720, 1024×768)에서 전 화면 자동 점검 0건이다. 실기기(태블릿·전자칠판) 확인과 교사 콘텐츠 검수는 아직이다. 자세한 내용은 작업 메모에 있다.

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
