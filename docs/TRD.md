# 보이지 않는 흔적 TRD

문서 버전: 1.0 설계 초안 · 2026-10-28
연결 문서: [PRD](PRD.md), [장별 시나리오](SCENARIO_DRAFT.md), [설계 데이터](STAGE_CONTENT.json)
상태: 앱 구현 전 기술 명세. 아래 경로·타입·명령은 구현 목표이며 현재 존재하는 기능이 아니다.

## 1. 기술 선택과 경계

| 영역 | 구현 기준 | 목적 |
|---|---|---|
| 언어·빌드 | TypeScript strict + Vite, npm 단일 사용 | 판정·데이터 타입 확인과 정적 출력 |
| 게임 장면 | Phaser | 픽셀 선택 맵, 2D 오브젝트·애니메이션·조작 |
| 학습 UI | DOM/CSS + SVG | 버튼·카드·설명·패널·타임라인·관계선·접근성 |
| 상태 | 단일 GameStore + typed EventBus | UI·게임의 중복 상태와 이중 판정 방지 |
| 탐구 모형 | 순수 함수와 고정 데이터 | 시간 복원, 동일 조건 비교, 예산 검증 |
| 저장 | SafeStorage, localStorage | 기기 내 자동 저장·이어하기 |
| 서비스 | 정적 웹앱 | 서버·인증·DB·학생 계정 없이 실행 |

C01의 2.5D는 고정 시점 픽셀 스프라이트와 깊이 정렬로 표현한다. 실시간 3D 엔진은 필요하지 않다. 일반 학습 장면은 2D 배경+별도 오브젝트다. React는 기본 의존성에 포함하지 않고 DOM 컴포넌트로 구성한다. 패키지의 구체 버전은 구현 시작 시 공식 호환성을 확인해 잠금 파일에 고정한다.

[Vite 공식 가이드](https://vite.dev/guide/)에 따라 개발 서버와 정적 빌드를 사용한다. [Phaser 입력](https://docs.phaser.io/phaser/concepts/input)은 게임 대상의 포인터 입력을 처리한다. Scale Manager의 `FIT`은 게임 영역의 비율을 유지하는 기준으로 사용한다. [Phaser Scale Manager](https://docs.phaser.io/phaser/concepts/scale-manager)

## 2. 예정 폴더와 책임

```text
invisible-traces/
  index.html
  package.json
  package-lock.json
  vite.config.ts
  tsconfig.json
  public/assets/          # 실제로 사용할 최적화된 파일만
  src/
    main.ts
    app/AppController.ts  # 라우트·게임 1개·공통 UI 초기화
    state/
      GameStore.ts
      reducers.ts
      selectors.ts
      SaveManager.ts
    events/EventBus.ts
    game/scenes/
      BootScene.ts
      TitleScene.ts
      WorldMapScene.ts
      ObservationScene.ts
      EvidenceScene.ts
      RelationshipScene.ts
      ImpactScene.ts
      TimelineScene.ts
      PathLabScene.ts
      ConditionLabScene.ts
      ComparisonScene.ts
      StrategyScene.ts
      FinalScene.ts
    simulation/
      contact.ts
      timeline.ts
      experiments.ts
      strategy.ts
      evidence.ts
    input/
      GestureController.ts
      CoordinateMapper.ts
    loaders/AssetLoader.ts
    data/
      stages/
      cases/
      feedback/
      asset-manifest.json
    ui/
      components/
      pages/
      styles/tokens.css
      styles/base.css
      styles/components.css
    utils/AudioManager.ts
  tests/
```

현재 루트 `image/`, `files/`의 원본은 그대로 보관한다. `invisible-traces/`에는 이전 작업에서 만든 빈 준비 폴더와 에셋 확인용 이미지가 있을 뿐, 실행 가능한 앱은 없다. 실제 런타임 데이터는 docs의 설계 JSON에서 필요한 항목을 분리하고 런타임 스키마로 검증하여 사용한다.

## 3. 화면과 상태 전이

```text
C00 메인 → C01 선택 맵 → P01 → P02 [E1]
                            ↓
                    P03 → P04 [E2]
                            ↓
                    P05 → P06 [E3]
                            ↓
                    P07 → P08 [E4]
                            ↓
                    P09 [E5 계획] → P10 보고·적용·회복·엔딩·인증서
```

이 그림의 아래 방향은 다음 미션의 흐름이다. 미션 완료 후 선택 맵 복귀는 선택이다. 상단 홈은 저장 후 C00, 지도 버튼은 C01로 이동한다. 마지막 저장 화면으로 이어하기가 가능하다.

- `requirements`가 충족된 화면만 일반 플레이로 진입한다. 미완료 기록을 완료로 추정하지 않는다.
- 일반 페이지의 완료 판정은 파생 상태다. 완료가 되면 `계속` 하나가 활성화되고 강제 시간 제한 없이 관찰한다.
- P01은 세 구역 발견 뒤 장소 선택으로 P02 진입한다. P07은 행동과 예측이 확보되면 한 번만 실행 예약한다.
- P07 변경 실험은 P08에서 재생한다. P07에서 같은 애니메이션을 끝까지 보고 P08에서 또 의무 재생하지 않는다.
- P10 phase는 `report → apply → restored → ending → certificate`다. 보고는 자동 정리되며 적용 시작용 주 동작 하나만 둔다. 마지막 적용 뒤 회복이 이어진다.
- E5 생성과 S5 완료를 다른 상태로 보관한다. `canEnd = E1..E5 valid && planRevision == appliedPlanRevision && every(plan.actions, applied)`.
- 홈·지도·새로고침은 현재 의미 있는 상태를 저장한다. 이동 중 제스처는 취소하고 마지막 확정 상태로 복구한다.

## 4. 상태 모델과 불변 조건

```ts
type PageId = 'P01' | 'P02' | 'P03' | 'P04' | 'P05' |
              'P06' | 'P07' | 'P08' | 'P09' | 'P10';
type Route = 'C00' | 'C01' | PageId;
type EvidenceId = 'E1' | 'E2' | 'E3' | 'E4' | 'E5';

interface ResearchRun {
  id: string;
  contentVersion: string;
  caseId: string;
  route: Route;
  drafts: PageDrafts;
  evidence: Partial<Record<EvidenceId, EvidenceSnapshot>>;
  completedStages: string[];
  final: {
    phase: 'report' | 'apply' | 'restored' | 'ending' | 'certificate';
    planRevision: number | null;
    appliedActionIds: string[];
    coreClaimed: boolean;
  };
}
```

- E5 생성만으로 S5를 완료하지 않는다.
- E1~E5는 runId·caseId·contentVersion·입력 revision을 갖는 스냅샷이다.
- E1~E4가 만들어지면 해당 미션의 본편 탐구 입력을 봉인한다. E5 생성은 P09 계획만 봉인하고 P10 적용 입력은 계속 허용한다. 다시 실험할 때는 `mode: replay`의 별도 세션을 만들며 본편 기록·해금·보상을 갱신하지 않는다.
- 미완료 미션에서 이전 장의 입력을 바꾸면 해당 입력에서 계산된 후속 초안과 스냅샷만 무효화한다. P07 행동을 바꾸면 P08의 차이 표시와 설명도 비운다. 사람·장소 등의 고정 조건까지 바꾸지 않는다.
- UI에 보이는 게이지·비용·해금은 selector에서 계산한다. 수치와 표시용 수치를 별도 정답으로 두지 않는다.
- 보상은 runId+보상 ID 단위로 한 번만 지급한다. 엔딩 재생·인증서 재출력이 지급을 다시 호출하지 않는다.

## 5. 이벤트와 입력 단일 처리

입력은 command → reducer → validate/derive → store commit → UI/Scene 반영 순서다. 장면의 효과음·애니메이션은 commit 후 사건에 반응한다. 효과가 실패해도 상태는 유지된다.

대표 command:

```text
site:discovered(siteId)
clue:toggle(clueId)
relation:connect(fromId, toId, relationType)
impact:link(effectId, domainId, reasonId)
timeline:seek(tick)
intervention:set(actionId, tick)
experiment:condition(actionId)
experiment:predict(value)
comparison:pin(eventId)
strategy:ask(questionId)
strategy:place(actionId, siteId)
strategy:simulate()
final:apply(planRevision, actionInstanceId)
```

DOM 버튼은 네이티브 `click` 한 경로만 사용하고 Enter/Space도 동일 command로 합친다. Phaser 게임 대상은 `pointerdown/move/up` 경로로 제스처를 인식하고 클릭과 드래그를 한 동작에서 중복 처리하지 않는다. Canvas 위에 같은 대상을 받는 DOM 버튼을 겹치지 않는다. DOM 대안 조작은 같은 reducer를 호출한다.

한 gesture에 pointerId·sceneSessionId를 붙인다. 전환 중, 모달 열림, 취소된 sceneSession의 응답은 무시한다. 같은 질문·같은 적용 항목을 중복 전송해도 reducer가 이미 반영된 명령으로 판단한다. 유효한 별도 조작을 시간 디바운스로 누락시키지 않는다.

드래그 중에는 시각 위치만 변경하고 drop/확정 시 의미 상태를 commit한다. `pointercancel`, 창 포커스 이탈, 기기 회전 시 원위치 또는 마지막 확정 상태로 복구한다. 첫 포인터만 해당 제스처 소유자로 사용한다.

## 6. C01 픽셀 선택 맵

기본 월드 좌표 `(u,v)`는 아이소메트릭 화면 좌표로 투영한다.

```text
screenX = originX + (u - v) * tileWidth / 2
screenY = originY + (u + v) * tileHeight / 2
```

고정 카메라에서 미리 정의한 길의 노드 사이를 이동한다. 배경과 건물은 정적 픽셀 이미지, 캐릭터는 4방향 또는 필요한 방향의 짧은 이동 애니메이션이다. 지면 기준 y/발 기준점을 이용해 깊이를 정렬하고 겹치는 물체의 앞·뒤가 바뀌게 한다. 자유 카메라 회전·실시간 3D 지형은 구현하지 않는다.

목적지 선택 시 현재 전환 요청 하나만 유지한다. `빠른 이동`과 모션 감소에서는 이동 시간을 줄여 같은 진입 결과를 만든다. 이동 도중 홈으로 나가면 tween과 예약 입장을 취소한다. DOM 미션 목록은 캔버스와 같은 잠금 상태를 사용한다.

## 7. P01~P04 판정

### P01/P02

스캔은 scanner 위치와 normalized hotspot의 넓은 영역 교차로 판정한다. 발견된 구역은 set로 저장한다. 숨은 버튼을 반복 누르는 방식으로 만들지 않는다.

P02는 Set<clueId> 크기 ≤5를 보장한다. 새 단서를 더할 때 가득 찼으면 교체할 기존 슬롯을 선택하는 상태를 연다. 임의 삭제·자동 교체는 하지 않는다. 5개가 찼을 때 `requiredClues.every(selected.has)`를 판정한다. 분류와 관계 문항을 P02에 추가로 반복하지 않는다.

### P03

관계 그래프는 노드와 방향·의미를 가진 edge로 저장한다. 현재 기본 사건은 JSON의 acceptedBranches에서 2개 이상을 충족하면 통과한다. 유효한 edge만으로 설명할 수 있는 가지를 센다. 카드 배치 좌표, 그린 선의 궤적, 단순 드래그 횟수는 판정값이 아니다. 동일 edge 중복, 자기 연결, 정의되지 않은 노드를 거부한다.

관계의 방향이 학습 의미를 바꾸지 않는 경우에는 데이터에서 무방향 관계로 선언해 정규화한다. 관찰 관계와 실제 원인 확정을 혼동하는 선 이름은 사용하지 않는다.

### P04

세 domain별 effectId+reasonId 연결을 검증한다. 한 영역을 두 번 채워 세 영역 완료로 계산하지 않는다. 잘못된 영역만 고칠 수 있으며 P03의 그래프는 그대로 유지한다.

## 8. P05 시간 복원 모형

`simulateContact(initial, orderedEvents, intervention, playhead)`는 DOM·Phaser·벽시계에 의존하지 않는 순수 함수다. 매번 동일 initial에서 시작해 playhead 이하의 사건만 적용한다. 화면 시간을 뒤로 움직일 때 현재 상태에서 역연산하는 방식은 사용하지 않는다.

기본 fixture `contact-chain-v1`:

| tick | 사건 | 모형 의미 |
|---:|---|---|
| 0 | 책에 초기 흔적 | 사람을 최초 원인으로 지목하지 않음 |
| 1 | 책 → 학생 A의 손 | 관찰할 접촉 기록 |
| 2 | A의 손 → 공 | 물체로 이어짐 |
| 3 | 공 → B의 손 | 다른 손과 이어짐 |
| 4 | B의 손 → 문손잡이 | 다음 물체로 이어짐 |
| 5 | 문손잡이 → C의 손 | 연속된 접촉 기록 |

1.5 tick의 손 씻기는 A의 손 상태만 바꾼다. 2.5 tick 이후 손 씻기는 공에 이미 남은 기록을 제거하지 않는다. 개입과 사건이 같은 tick에 놓이는 모호함을 피하도록 기본 UI는 사건 사이 경계에 snap한다. 내부 이벤트는 tick, stableId 순으로 정렬한다.

현재 장면은 `snapshotAt(playhead)`의 인물·물체·흔적과 경로선을 함께 그린다. pause/resume, 끝→처음→중간, 새로고침 후에도 같은 snapshot을 재현한다. seed는 시각 장식의 위치와 재현에만 쓸 수 있고 확률적 감염 판정에는 쓰지 않는다.

최초 위치를 고른 기록, 전달 경로 해석, 효과적인 개입으로 달라진 후속 연결을 P05 결과에 남긴다. 개입 횟수·드래그 거리로 정답을 결정하지 않는다.

## 9. P06 모듈과 P07~P08 비교

### P06 모듈 계약

각 모듈은 initialCondition, changedCondition, observationBefore, observationAfter, interpretation을 반환한다. 접촉은 P05 결과의 case/version을 확인해 재사용한다. 나머지는 각각의 독립된 장치에서 전후 상태를 보여준다. 관찰 기록은 장치별 ID로 덮어쓰며 재실험마다 중복 완료 수를 늘리지 않는다.

모듈 관찰의 완료는 학습 질문에 해당하는 조건 변경과 결과 도달로 판정한다. 빨리 움직이는 것, 오래 문지르는 것, 모든 프레임 시청은 요구하지 않는다. 공기 장면은 창문 개방률에 따른 방향·흐름 모형을 설명하며 실제 병원체 농도 계산으로 제시하지 않는다.

### P07/P08 비교 계약

```text
BaselineKey = caseId + contentVersion + seed + fixedConditions
A = runScenario(BaselineKey, unchanged)
B = runScenario(BaselineKey, exactlyOneAction)
```

A와 B는 place, actors, time, eventOrder, seed, observationTimes를 공유한다. B 설정은 단일 actionId 필드라 동시에 두 행동이 켜질 수 없다. 선택 교체 시 이전 B와 P08 설명을 무효화하고 A는 유지한다.

예측 command가 유효하면 experimentRevision을 한 번 증가시켜 B를 만든다. 결과가 늦게 도착할 경우 요청 revision이 현재와 다르면 버린다. P08 진입 전에 스냅샷 준비 실패 시 선택을 유지하고 재시도를 표시한다.

두 장면은 하나의 playhead를 사용한다. 선택 행동과 관련된 관찰 metric만 차이로 강조한다. 한 행동이 모든 경로를 일괄 지우지 않는다. P08의 pin은 B의 실제 차이가 있는 eventId에 연결되며 원인·결과 edge도 해당 행동·metric 조합으로 검증한다. 예측의 정오와 결과 설명의 타당성은 따로 보관한다.

## 10. P09 전략과 P10 적용

### 전략 판정

`usedEnergy = sum(uniquePlacements.map(action.cost))`이며 예산 5를 넘는 추가 배치는 commit하지 않는다. 취소·교체는 전체 새 배치의 유효성을 확인한 뒤 원자적으로 반영한다. 자동 보정으로 다른 카드를 조용히 빼지 않는다.

현재 fixture의 핵심 요구는 classroom:ventilation, cafeteria:portionFood, gym:washHands다. 비용 합 5의 유효 계획이 존재해야 fixture를 배포할 수 있다. 기침 예절 등의 보조 행동은 해당 가지를 바꾸되 세 핵심 요구를 모두 대신하지 않는다.

질문은 최초 공개한 distinctQuestionIds로만 비용을 계산한다. 이미 공개된 답변 다시 보기는 무료다. 질문권이 0이어도 E1~E4와 실패 피드백에 접근할 수 있다. `simulate`는 순수 판정 결과 `{resolvedSites, remainingLinks, feedbackIds}`를 반환한다. 실행 횟수에 따라 정답이 바뀌지 않는다.

### 최종 적용

성공한 계획은 E5에 planRevision과 actionInstanceId 목록으로 고정한다. P10은 각 instance의 actionId에 매칭한 GestureAdapter를 표시한다. 창문 swipe, 접시 배치, 손 영역 확인 등은 같은 `final:apply`로 수렴한다. 대안 입력도 동일 명령과 판정을 사용한다.

중복 apply는 무시한다. 적용 도중 이탈하면 완료한 instance를 저장하고 다음 미적용 항목부터 돌아온다. 새로고침이 에너지나 행동 목록을 바꾸지 않는다. E5와 다른 계획 revision의 입력은 거부한다. 모든 항목을 적용한 후에만 restored와 coreClaimed를 함께 commit하여 중복 보상을 방지한다.

## 11. 저장·복구·재실험

저장 키는 `invisible-traces-science-save-v1`, envelope은 schemaVersion, contentVersion, savedAt, settings, activeRun, optionalReplay를 갖는다. 원시 포인터 기록·매 프레임 스냅샷·개인정보·건강정보는 저장하지 않는다.

저장 시점은 단서 교체·관계 연결·제스처 확정·개입 변경·실험 결과·질문·배치·Evidence 생성·장면 이동이다. 타임라인 scrub은 놓는 시점의 playhead만 저장한다. visibilitychange의 hidden 시에도 마지막 확정 상태를 best effort로 저장한다. 저장 성공을 전제로 진행을 막지 않는다.

로드 시 JSON 파싱, 허용 ID, 길이·범위, 중복 배열, 단서 수, 그래프 edge, budget, evidence 의존성, 계획 revision을 재검증한다. 저장된 `completed=true`나 비용 합을 신뢰하지 않고 파생 판정으로 복원한다. 숫자 NaN/Infinity와 알 수 없는 경로를 거부한다.

- 저장 실패: 메모리에서 계속 실행하고 `이 기기에 기록을 저장하지 못했어요`를 한 번 안내한다.
- 잘못된 JSON: 앱을 멈추지 않고 새 연구 시작과 복구 가능한 기록 안내를 제공한다. 원본을 조용히 삭제하지 않는다.
- schemaVersion 차이: 명시된 migration만 수행한다. 변환할 수 없으면 기존 데이터를 보존하고 새 연구를 제안한다.
- contentVersion 차이: 검증된 호환 맵이 있으면 변환하고, 없으면 기존 기록은 읽기용으로 보존하며 현재 판정에 섞지 않는다.
- 다른 배포 origin에서는 localStorage가 공유되지 않으므로 교사용 안내에 저장 범위를 표시한다.

재실험은 본편 run의 스냅샷을 복사한 별도 mode다. E1~E5·해금·보상은 본편에 덮어쓰지 않는다. 교사용 전체 해금은 진입 권한만 열며 앞선 기록이 필요한 장은 표시된 예시 fixture로 시연한다. 시연 결과는 학생 본편 저장과 완주 판정에 합치지 않는다. 전체 해금으로 모든 자산을 preload하지 않는다.

## 12. 화면 배치와 좌표

앱은 top HUD / main playfield+optional panel / bottom actions의 grid로 만든다. `--app-height`는 visualViewport.height, 없으면 innerHeight를 사용하고 resize·orientationchange에 갱신한다. CSS는 100dvh/100svh fallback과 safe-area를 적용한다.

Phaser의 논리 영역과 DOM 패널을 각각 배치한다. Canvas는 playfield 내부에서 비율을 유지하고 DOM 글자·버튼까지 통째로 축소하지 않는다. 1280×720 화면에서도 CSS 터치 최소 44px, 본문 18px 이상을 확보한다. 공간이 부족하면 패널을 접거나 내부 스크롤을 사용하고 핵심 조작을 아래로 밀지 않는다.

Phaser 대상 좌표는 Phaser pointer의 scene 좌표를 사용한다. DOM 대상은 실제 boundingClientRect, SVG는 getScreenCTM의 역변환으로 입력을 투영한다. Canvas에 수동 scale 보정을 또 적용해 이중 변환하지 않는다. 같은 학습 대상에 쓰는 DOM 안내 위치는 하나의 CoordinateMapper에서 계산한다.

레이어는 background < game < HUD < mission UI < modal-backdrop < modal < toast다. 공통 모달이 열리면 DOM inert와 게임 입력 차단을 같이 적용한다. 닫을 때 이전 focus와 입력 상태를 복원한다. 학습 오브젝트가 배경 이미지에 그려져 있더라도 독립 판정·변화가 필요하면 별도 자산/그래픽으로 만든다.

## 13. 자산과 로딩 예산

다음은 측정 결과가 아니라 **최적화 후 목표 예산**이다.

| 단계 | 필수 파일 목표 | 총 요청 수 목표 | 전송량 목표 |
|---|---|---:|---:|
| C00 첫 화면 | HTML, 앱 shell JS, CSS, main WebP, SVG icon, 선택한 local WOFF2 | ≤6 | ≤1.5MiB |
| 첫 활동 P01 | 필요 시 Phaser chunk, S1 chunk·data, 현장 WebP, 공통 인물, 오브젝트 묶음 | 추가 ≤6 | 추가 ≤2MiB |
| C01 첫 진입 | 맵 chunk, pixel atlas, 맵 data | 추가 ≤3 | 추가 ≤1.5MiB |
| 이후 각 S | 해당 미션 data·chunk·배경·오브젝트 | 추가 ≤8 | 추가 ≤2MiB |

공통 폰트는 시스템 fallback이 가능하며 폰트 실패가 시작을 막지 않는다. Phaser 코드는 메인에서 필요하지 않으면 동적 import한다. C01을 거쳐 P01로 진입할 때 각 예산을 합쳐 실제 전송량을 기록한다. 위 한도를 넘으면 자산 분할과 지연 로딩을 재검토한다.

실제 선택 자산은 manifest에 id/path/scene/required/sizeBudget을 기록한다. 장면 진입에 필요한 파일만 Promise 캐시로 묶어 읽는다. 실패한 필수 파일만 최대 2회, 지수 지연+작은 무작위 지연으로 재시도한다. 이후에는 파일·HTTP 상태·경과 시간·온라인 여부와 `다시 시도`를 보여준다. 선택 음악·장식은 실패해도 진행한다.

이미지는 WebP 등으로 최적화하고 원본을 배포하지 않는다. 픽셀 맵은 nearest filtering, 학습 일러스트는 일반 필터링으로 별도 설정한다. 29번 제목과 30번 인물의 실제 투명도·분할·표시 품질을 확인하기 전에는 최종 자산으로 확정하지 않는다. 원격 CDN·외부 폰트를 필수 시작 경로로 쓰지 않는다.

사운드는 첫 사용자 입력 후 중앙 AudioManager가 시작한다. 음소거·play 실패·중복 BGM을 처리하고 장면 이탈 때 해당 소리와 예약 재생을 정리한다.

## 14. 장면 정리와 실패 처리

장면 shutdown에서 sceneSession을 폐기하고 timer, tween, pointer handler, EventBus 구독, audio, DOM 오버레이를 정리한다. loader 완료가 늦게 돌아와도 session이 다르면 이전 화면을 재열지 않는다. 홈→이어하기를 반복해도 Phaser 인스턴스는 하나만 존재한다.

모형 판정 오류는 해당 실험을 재시작할 수 있는 안내를 표시하고 이미 생성된 앞선 기록을 유지한다. 관찰 결과와 애니메이션이 다르면 모형 snapshot을 기준으로 다시 그린다. 예외를 숨겨 무한 로딩 상태로 두지 않는다.

## 15. 구현 순서와 검증

### 구현 단위

1. shell·뷰포트·저장·명령 처리와 C00/C01 최소 진입.
2. P05의 재현 가능한 모형과 P07/P08의 비교를 먼저 시제품으로 검증.
3. P01~P04의 기록 흐름, P06의 모듈 기록.
4. P09 예산·부분 성공과 P10 계획 적용·보상.
5. 최종 자산·소리·엔딩·교사용 시연·인쇄, 실기기 검증.

### 예정 명령

- `npm ci`: 잠금 파일이 만들어진 이후 재현 설치.
- `npm run check`: TypeScript 검사.
- `npm test`: 아래의 순수 판정 회귀 검사.
- `npm run build`: `tsc --noEmit && vite build`.

현재는 package.json이 없으므로 위 빌드·앱 테스트는 실행 대상이 아니다. 현재 실행 가능한 검증은 설계 데이터와 문서의 일관성 검사다.

### 의미 있는 자동 검사

| 연결 PRD | 검사 |
|---|---|
| AC02~03 | 핵심 단서 충족/미충족, 동등 관계 배치, 잘못된 node와 중복 edge, 영역 누락 |
| AC04 | P05 임의 seek와 순차 재생의 snapshot 동일, 늦은 개입의 이전 기록 유지 |
| AC05 | P05 결과 상속, 모듈 중복 완료 차단, 누락 기록의 올바른 되돌림 |
| AC06 | A/B fixedConditions 동일, 한 행동만 변경, 예측 오답도 관찰 가능, 오래된 revision 폐기 |
| AC07 | 예산 경계 5/6, 오배치 무차감, 교체 환급, 모든 질문 선택 조합의 복구 경로 |
| AC08 | 계획 항목 불일치 거부, P10 중간 새로고침, 반복 적용·엔딩의 중복 보상 차단 |
| AC11 | 손상 저장·버전 차이·알 수 없는 ID, 저장 금지 환경, loader 재시도 상한 |

### 브라우저·실기기 검사

1280×720, 1366×768, 1920×1080, 실제 가로 태블릿과 세로 전환, 전자칠판에서 수행한다. 지원 대상 브라우저·OS 버전은 실제 학교 기기 목록으로 고정한다.

터치·마우스·키보드로 각 스테이지 대표 성공·부분 실패를 끝까지 수행한다. 빠른 연속 입력, 드래그 취소, 모달 뒤 입력, 회전, 새로고침, 홈·지도 왕복, 음소거, 모션 감소, 저장 불가, 필수 자산 누락을 포함한다. 스크린샷만으로 타이밍과 판정을 통과 처리하지 않는다.

캐시 없는 30대의 동일 학교망 동시 첫 접속에서 메인뿐 아니라 첫 활동까지 확인한다. 자동 부하 검사는 보조이며 실제 교실망 검증과 구분한다. 아직 실행하지 않은 검사를 통과로 표시하지 않는다.

## 16. 설계 데이터의 단일 기준

`docs/STAGE_CONTENT.json`은 이번 설계의 사건·규칙 fixture다. 문서의 설명과 JSON이 다르면 한쪽을 조용히 따르지 않고 같이 수정한다. PRD의 AC01~AC12와 위 검증 항목을 변경 영향의 기준으로 삼는다.

구현 전 고정할 내용은 최종 배경·캐릭터 분리 품질, 픽셀 맵 제작물, 실제 기기의 브라우저 목록이다. 화면 수·예산·성공 조건은 이 초안의 작업 기준으로 명시했고, 수정될 수 있는 설계 선택과 이미 실행한 검증을 구분해 기록한다.
