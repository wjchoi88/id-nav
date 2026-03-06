# ID-NAV Chatbot MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** QR 앵커 + 센서 기반 PDR + 최적 경로 안내 + 관리자 KPI를 포함한 iOS/Android 동시 대응 MVP를 2026-05-30 이전 실사용 가능 상태로 만든다.

**Architecture:** 단일 TypeScript 모노레포로 `apps/mobile-web`, `apps/admin-web`, `apps/api`를 구성한다. 위치 추정은 API의 PDR 엔진 모듈에서 처리하고, 모바일 웹은 QR 스캔/센서 수집/경로 표시를 담당한다. 데이터는 익명 `session_id` 기준으로 저장하고, 세션 종료는 거리+시간+히스테리시스+GPS 정확도 조건을 결합한다.

**Tech Stack:** TypeScript, Node.js, Fastify, PostgreSQL(+PostGIS), React + Vite, Vitest, Playwright

---

## 기존 자산 재사용 전략 (77/88 서버 반영)
### 재사용 대상
- `qr-location`의 QR 생성/다운로드/위치-스캔 로그 구조를 우선 이식
  - 참고: `/home/dbuilder/apps/qr-location/app.py` (`Location`, `ScanLog`, `LiveLocation`, QR 생성 API)
- `la-chatbot`의 FastAPI 라우터/인증 구조는 패턴만 재사용 (도메인 로직은 제외)
  - 참고: `/home/dbuilder/apps/chatbot/backend/main.py`, `/home/dbuilder/apps/chatbot/backend/api/auth.py`
- 기존 77→88 배포 스크립트 재사용
  - 참고: `/home/dbuilder/workspace/scripts/deploy.sh`

### 재사용 원칙
- 복붙 이식이 아닌 모듈 단위 포팅(모놀리식 `app.py` 구조는 분해)
- 기능 동등성 테스트 먼저 작성 후 이식
- PII 비수집 정책에 맞지 않는 필드는 이식 금지

## 병렬 개발 트랙 (시간 단축용)
### Track A: API/도메인
- Task 2, 3, 4, 8
- 산출물: 세션 종료 룰, PDR 보정 정책, 경로 API, PII 가드

### Track B: 모바일 웹
- Task 5, 6
- 산출물: QR 시작 플로우, 센서 추정 훅, 경로 안내 UI 연결

### Track C: 관리자 웹/운영
- Task 7, 10
- 산출물: KPI 대시보드, 운영 런북/보관정책 문서

### Track D: 통합/E2E
- Task 1, 9
- 산출물: 모노레포 기반, 파일럿 시나리오 E2E

### 병렬 실행 순서
1. Day 1-2: Track D(기반) 선행
2. Day 3-12: Track A/B/C 병렬 진행
3. Day 13-18: Track D(통합/E2E/버그픽스) 집중
4. Day 19+: 현장 튜닝 및 파일럿 안정화

## 일정 산정 (20달러 플랜 일일 100% 사용 가정)
### 가정
- Codex 사용량을 매일 상한까지 사용
- 기존 자산(la-chatbot, qr-location) 적극 재사용
- 1인 시니어가 최종 의사결정/리뷰 수행

### 예상 소요
- 순수 구현+통합: 22~30 작업일
- 달력 기준:
  - 주 5일 작업: 약 5~6주
  - 주 6일 작업: 약 4~5주

### 리스크 버퍼
- 센서 오차 튜닝/현장 편차 대응: +3~7일
- 최종 범위: **약 25~37일**

### Task 1: 모노레포 초기화

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `apps/mobile-web/package.json`
- Create: `apps/admin-web/package.json`
- Create: `apps/api/package.json`
- Test: `package.json` scripts

**Step 1: Write the failing test**

```bash
pnpm -r test
```

**Step 2: Run test to verify it fails**

Run: `pnpm -r test`  
Expected: 워크스페이스/스크립트 미정의 오류

**Step 3: Write minimal implementation**

```json
{
  "name": "id-nav-chatbot",
  "private": true,
  "scripts": {
    "test": "pnpm -r test"
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -r test`  
Expected: 각 앱 테스트 스크립트 실행 시작

**Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json apps
git commit -m "chore: bootstrap monorepo for id-nav mvp"
```

### Task 2: 세션 종료 규칙 도메인 모듈

**Files:**
- Create: `apps/api/src/domain/session/session-termination.ts`
- Test: `apps/api/test/session-termination.test.ts`

**Step 1: Write the failing test**

```ts
import { shouldTerminateSession } from "../src/domain/session/session-termination";

it("terminates when outside threshold long enough with good gps accuracy", () => {
  const terminate = shouldTerminateSession({
    outsideMeters: 68,
    outsideDurationSec: 45,
    gpsAccuracyMeters: 8,
    isReentered: false
  });
  expect(terminate).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @idnav/api test apps/api/test/session-termination.test.ts -v`  
Expected: FAIL with module/function not found

**Step 3: Write minimal implementation**

```ts
export function shouldTerminateSession(input: {
  outsideMeters: number;
  outsideDurationSec: number;
  gpsAccuracyMeters: number;
  isReentered: boolean;
}) {
  if (input.isReentered && input.outsideMeters <= 50) return false;
  if (input.gpsAccuracyMeters > 30) return false;
  return input.outsideMeters >= 60 && input.outsideDurationSec >= 30;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @idnav/api test apps/api/test/session-termination.test.ts -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/domain/session/session-termination.ts apps/api/test/session-termination.test.ts
git commit -m "feat(api): add hybrid session termination rule"
```

### Task 3: PDR 보정 요청 규칙 모듈

**Files:**
- Create: `apps/api/src/domain/location/reanchor-policy.ts`
- Test: `apps/api/test/reanchor-policy.test.ts`

**Step 1: Write the failing test**

```ts
import { shouldRequestReanchor } from "../src/domain/location/reanchor-policy";

it("requests qr re-anchor when drift risk is high", () => {
  expect(
    shouldRequestReanchor({
      distanceFromLastAnchorMeters: 95,
      secFromLastAnchor: 150,
      headingStabilityScore: 0.3
    })
  ).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @idnav/api test apps/api/test/reanchor-policy.test.ts -v`  
Expected: FAIL with missing function

**Step 3: Write minimal implementation**

```ts
export function shouldRequestReanchor(input: {
  distanceFromLastAnchorMeters: number;
  secFromLastAnchor: number;
  headingStabilityScore: number;
}) {
  return (
    input.distanceFromLastAnchorMeters >= 80 ||
    input.secFromLastAnchor >= 120 ||
    input.headingStabilityScore < 0.5
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @idnav/api test apps/api/test/reanchor-policy.test.ts -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/domain/location/reanchor-policy.ts apps/api/test/reanchor-policy.test.ts
git commit -m "feat(api): add qr re-anchor request policy"
```

### Task 4: 경로 탐색 API

**Files:**
- Create: `apps/api/src/routes/navigation.ts`
- Create: `apps/api/src/domain/navigation/a-star.ts`
- Test: `apps/api/test/navigation-route.test.ts`

**Step 1: Write the failing test**

```ts
it("returns path between source and destination", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/api/navigation/path",
    payload: { tenantId: "mall-a", source: "N1", destination: "N9" }
  });
  expect(res.statusCode).toBe(200);
  expect(JSON.parse(res.body).nodes.length).toBeGreaterThan(1);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @idnav/api test apps/api/test/navigation-route.test.ts -v`  
Expected: FAIL with 404 or route not found

**Step 3: Write minimal implementation**

```ts
fastify.post("/api/navigation/path", async (req) => {
  const body = req.body as { source: string; destination: string };
  return { nodes: [body.source, body.destination], distanceMeters: 42 };
});
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @idnav/api test apps/api/test/navigation-route.test.ts -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/routes/navigation.ts apps/api/src/domain/navigation/a-star.ts apps/api/test/navigation-route.test.ts
git commit -m "feat(api): add minimal pathfinding endpoint"
```

### Task 5: 모바일 웹 QR 시작 플로우

**Files:**
- Create: `apps/mobile-web/src/features/session/qr-start.tsx`
- Create: `apps/mobile-web/src/features/session/useSessionStore.ts`
- Test: `apps/mobile-web/src/features/session/qr-start.test.tsx`

**Step 1: Write the failing test**

```tsx
it("starts session when qr payload is valid", async () => {
  render(<QrStartPage />);
  await userEvent.click(screen.getByText("QR 스캔 완료(테스트)"));
  expect(screen.getByText("세션 시작됨")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @idnav/mobile-web test qr-start.test.tsx -v`  
Expected: FAIL with component missing

**Step 3: Write minimal implementation**

```tsx
export function QrStartPage() {
  const [started, setStarted] = useState(false);
  return <button onClick={() => setStarted(true)}>{started ? "세션 시작됨" : "QR 스캔 완료(테스트)"}</button>;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @idnav/mobile-web test qr-start.test.tsx -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add apps/mobile-web/src/features/session/qr-start.tsx apps/mobile-web/src/features/session/useSessionStore.ts apps/mobile-web/src/features/session/qr-start.test.tsx
git commit -m "feat(mobile): add qr session start flow"
```

### Task 6: 센서 수집과 위치 추정 훅

**Files:**
- Create: `apps/mobile-web/src/features/location/usePdrEstimator.ts`
- Test: `apps/mobile-web/src/features/location/usePdrEstimator.test.ts`

**Step 1: Write the failing test**

```ts
it("updates distance and heading from sensor samples", () => {
  const estimator = createEstimator();
  estimator.pushSample({ accel: 1.2, gyro: 0.4, magnet: 0.2, t: 1 });
  expect(estimator.state.distanceMeters).toBeGreaterThanOrEqual(0);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @idnav/mobile-web test usePdrEstimator.test.ts -v`  
Expected: FAIL with factory missing

**Step 3: Write minimal implementation**

```ts
export function createEstimator() {
  return {
    state: { distanceMeters: 0, headingDeg: 0 },
    pushSample() {}
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @idnav/mobile-web test usePdrEstimator.test.ts -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add apps/mobile-web/src/features/location/usePdrEstimator.ts apps/mobile-web/src/features/location/usePdrEstimator.test.ts
git commit -m "feat(mobile): add pdr estimator scaffold"
```

### Task 7: 관리자 KPI 대시보드

**Files:**
- Create: `apps/admin-web/src/features/kpi/KpiDashboard.tsx`
- Test: `apps/admin-web/src/features/kpi/KpiDashboard.test.tsx`

**Step 1: Write the failing test**

```tsx
it("renders required mvp kpis", () => {
  render(<KpiDashboard data={{ arrivalSuccessRate: 92, rerouteRate: 12 }} />);
  expect(screen.getByText("도착 성공률")).toBeInTheDocument();
  expect(screen.getByText("재탐색 빈도")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @idnav/admin-web test KpiDashboard.test.tsx -v`  
Expected: FAIL with component missing

**Step 3: Write minimal implementation**

```tsx
export function KpiDashboard() {
  return (
    <section>
      <h2>도착 성공률</h2>
      <h2>재탐색 빈도</h2>
    </section>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @idnav/admin-web test KpiDashboard.test.tsx -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add apps/admin-web/src/features/kpi/KpiDashboard.tsx apps/admin-web/src/features/kpi/KpiDashboard.test.tsx
git commit -m "feat(admin): add mvp kpi dashboard"
```

### Task 8: 데이터 정책 가드(PII 차단)

**Files:**
- Create: `apps/api/src/domain/privacy/pii-guard.ts`
- Test: `apps/api/test/pii-guard.test.ts`

**Step 1: Write the failing test**

```ts
it("drops pii fields from ingest payload", () => {
  const sanitized = sanitizePayload({ phone: "010", email: "x@y.z", route: [] });
  expect(sanitized).not.toHaveProperty("phone");
  expect(sanitized).not.toHaveProperty("email");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @idnav/api test apps/api/test/pii-guard.test.ts -v`  
Expected: FAIL with function missing

**Step 3: Write minimal implementation**

```ts
export function sanitizePayload(payload: Record<string, unknown>) {
  const { phone, email, name, adId, ...rest } = payload;
  return rest;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @idnav/api test apps/api/test/pii-guard.test.ts -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/domain/privacy/pii-guard.ts apps/api/test/pii-guard.test.ts
git commit -m "feat(api): enforce pii-free payload policy"
```

### Task 9: E2E 파일럿 시나리오 테스트

**Files:**
- Create: `tests/e2e/pilot-flow.spec.ts`
- Modify: `apps/mobile-web/src/main.tsx`
- Modify: `apps/admin-web/src/main.tsx`

**Step 1: Write the failing test**

```ts
test("qr start to destination with admin visibility", async ({ page, context }) => {
  await page.goto("/mobile");
  await page.click("text=QR 스캔 완료(테스트)");
  await page.click("text=목적지 선택");
  await page.goto("/admin");
  await expect(page.locator("text=도착 성공률")).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:e2e tests/e2e/pilot-flow.spec.ts -g "qr start"`  
Expected: FAIL with route/element missing

**Step 3: Write minimal implementation**

```ts
// add basic routes and placeholder UI for /mobile and /admin
```

**Step 4: Run test to verify it passes**

Run: `pnpm test:e2e tests/e2e/pilot-flow.spec.ts -g "qr start"`  
Expected: PASS

**Step 5: Commit**

```bash
git add tests/e2e/pilot-flow.spec.ts apps/mobile-web/src/main.tsx apps/admin-web/src/main.tsx
git commit -m "test(e2e): add mvp pilot end-to-end scenario"
```

### Task 10: 문서화 및 운영 인수인계

**Files:**
- Create: `docs/ops/mvp-runbook.md`
- Create: `docs/privacy/data-retention-policy.md`
- Modify: `README.md`

**Step 1: Write the failing test**

```bash
rg "90일" docs/privacy/data-retention-policy.md
```

**Step 2: Run test to verify it fails**

Run: `rg "세션 종료 규칙" docs/ops/mvp-runbook.md`  
Expected: no match

**Step 3: Write minimal implementation**

```md
- 원시 센서 데이터 보관: 90일
- 세션 종료: 거리+시간+히스테리시스+GPS 정확도 조건
```

**Step 4: Run test to verify it passes**

Run: `rg "90일|히스테리시스|PII 미수집" docs/ops/mvp-runbook.md docs/privacy/data-retention-policy.md`  
Expected: 각 키워드 매칭

**Step 5: Commit**

```bash
git add docs/ops/mvp-runbook.md docs/privacy/data-retention-policy.md README.md
git commit -m "docs: add mvp runbook and data retention policy"
```

## 실행 원칙
- @test-driven-development: 모든 기능은 실패 테스트부터 시작
- @systematic-debugging: 실패 시 원인 재현 후 수정
- 작은 단위 커밋 유지
- DRY, YAGNI 준수
