# 보이지 않는 흔적

초등 3학년 과학 「감염병과 건강한 생활」을 위한 탐구 게임. 5스테이지·학습 10장으로 구성하고, 스테이지 선택 맵만 2.5D 픽셀아트 RPG로 표현한다.

## 현재 상태

**구현 중간 저장본이다.** TypeScript 검사는 통과했다. 아직 src/ui/style.css가 없어 프로덕션 빌드는 실패하며, 브라우저 플레이 검증 전이다. 사용자 요청으로 현재 상태를 커밋하고 작업을 중단했다.

- 저장소: https://github.com/yelmovie/healthy-habits-quest
- [재개 메모와 알려진 미완료 작업](docs/WORK_STATUS.md)
- [PRD](docs/PRD.md) · [TRD](docs/TRD.md) · [장별 시나리오](docs/SCENARIO_DRAFT.md)
- [설계 데이터](docs/STAGE_CONTENT.json) · [설계 검증 결과](docs/DESIGN_VALIDATION.md)

## 개발

```powershell
Set-Location -LiteralPath 'invisible-traces'
npm ci
npm run check
npm run dev
```

npm run build는 스타일 파일을 작성한 뒤 실행한다. npm test 스크립트는 준비했지만 실제 테스트 파일은 아직 없다. 원본 image/와 files/는 로컬 참고 자료이고, 최적화한 게임 배경은 invisible-traces/public/assets/에 있다.
