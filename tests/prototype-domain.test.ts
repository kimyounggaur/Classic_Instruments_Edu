import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  APP_URLS,
  INSTRUMENTS,
  LEGACY_MANIFEST,
  STORAGE_KEY,
  appBlockers,
  bookPositionKey,
  canDownload,
  canOpenApp,
  canPrint,
  canPublish,
  createPrototypeRepository,
  createSeed,
  dataSchema,
  demoVisible,
  integrityErrors,
  parseSearchQuery,
  planSchema,
  planWarnings,
  publishBlockers,
  searchResources,
  serializeSearchQuery,
  validateAppUrl,
} from "../lib/prototype/index.ts";
import type { RepositoryData, StorageAdapter } from "../lib/prototype/index.ts";

function memoryStorage(
  initial?: string,
): StorageAdapter & { values: Map<string, string> } {
  const values = new Map<string, string>();
  if (initial) values.set(STORAGE_KEY, initial);
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}
function visible(data = createSeed()) {
  return data.resources.filter((resource) =>
    demoVisible(
      resource,
      data.versions.find(
        (version) => version.id === resource.publishedVersionId,
      )!,
      data.issues,
    ),
  );
}
function issueFor(
  resourceId = "demo-violin-textbook",
  versionId = `${resourceId}-v1`,
) {
  return {
    resourceId,
    versionId,
    unitId: null,
    blockId: null,
    category: "safety" as const,
    severity: "major" as const,
    description: "안전 문제 신고의 합성 예시",
    evidence: "데모 위치 확인",
    suggestion: "공개를 보류하고 검수자 확인",
  };
}

test("D01 seed validates references and separates exact legacy/plan/app/shelf totals", () => {
  const data = createSeed();
  assert.equal(dataSchema.safeParse(data).success, true);
  assert.deepEqual(integrityErrors(data), []);
  assert.equal(data.legacyEntries.length, 19);
  assert.equal(data.modulePlans.length, 24);
  assert.equal(data.apps.length, 37);
  assert.equal(visible(data).length, 8);
  assert.equal(data.resources.length, 12);
  assert.deepEqual(
    INSTRUMENTS.map(
      (instrument) =>
        data.legacyEntries.filter((entry) => entry.instrument === instrument)
          .length,
    ),
    [7, 4, 4, 4],
  );
  assert.equal(
    data.legacyEntries.reduce((total, entry) => total + entry.questionCount, 0),
    38,
  );
  assert.ok(
    data.legacyEntries.every(
      (entry) =>
        entry.reviewState === "draft" &&
        entry.approvedAt === null &&
        entry.body === null &&
        entry.rightsState === "unknown",
    ),
  );
  assert.ok(data.modulePlans.every((plan) => plan.mappingState === "proposed"));
  assert.ok(
    data.apps.every((app) => app.status === "unchecked" && !app.enabled),
  );
});

test("D01 preserves all 19 IDs and 37 URLs exactly from the supplied prompt pack", () => {
  const pack = readFileSync(
    new URL(
      "../클래식_악기_교육_전자도서관_프롬프트팩_v1.1_책장형홈.md",
      import.meta.url,
    ),
    "utf8",
  );
  const legacy = [
    ...pack.matchAll(
      /^- `([^`]+)` \| (violin|cello|flute|clarinet) \| level/gm,
    ),
  ].map((match) => match[1]);
  const apps = pack
    .split("### C. 37개 앱 후보 URL 원본 목록")[1]
    .split("### D.")[0];
  const urls = [...apps.matchAll(/^\d+\. (https:\/\/\S+)/gm)].map(
    (match) => match[1],
  );
  assert.deepEqual(
    LEGACY_MANIFEST.map((entry) => entry.id),
    legacy,
  );
  assert.deepEqual([...APP_URLS], urls);
});

test("D01 foreign key validation detects version, unit, plan and issue mismatches", () => {
  const data = createSeed();
  data.units[0].resourceVersionId = data.versions[1].id;
  data.plans[0].activities[1].resources[0].unitId = "missing";
  data.issues[0].unitId = "missing";
  assert.ok(integrityErrors(data).some((error) => error.includes("판본 참조")));
  assert.ok(integrityErrors(data).some((error) => error.includes("교안 판본")));
  assert.ok(integrityErrors(data).some((error) => error.includes("신고 위치")));
});

test("Q01-Q08 search combines AND across filters, OR within filters, aliases and Unicode", () => {
  const resources = visible();
  assert.ok(
    searchResources(resources, { instruments: ["violin"] }).every(
      (resource) => resource.instrument === "violin",
    ),
  );
  assert.equal(
    searchResources(resources, { instruments: ["cello"], levels: [1] }).length,
    1,
  );
  assert.equal(searchResources(resources, { q: "플룻" }).length, 2);
  assert.equal(searchResources(resources, { q: "  FLUTE  " }).length, 2);
  assert.equal(searchResources(resources, { q: "ＦＬＵＴＥ" }).length, 2);
  const clarinetScore = searchResources(resources, {
    instruments: ["clarinet"],
    kinds: ["score"],
  });
  assert.equal(clarinetScore.length, 1);
  assert.equal(clarinetScore[0].instrumentSystem, "표준 Bb 보엠식");
  assert.equal(searchResources(resources, { topics: ["수업 준비"] }).length, 8);
  assert.equal(
    searchResources(resources, {
      instruments: ["violin"],
      kinds: ["activity"],
      levels: [2],
    }).length,
    1,
  );
  assert.equal(
    searchResources(resources, {
      instruments: ["violin", "cello"],
      levels: [1, 2],
    }).length,
    4,
  );
  assert.equal(searchResources(resources, { q: "존재하지않는단어" }).length, 0);
});

test("Q09 URL query restores filters and ignores invalid enum values", () => {
  const query = parseSearchQuery(
    "?q=%20FLUTE%20&instrument=flute,unknown&kind=textbook&level=1,99&sort=recent",
  );
  assert.deepEqual(query.instruments, ["flute"]);
  assert.deepEqual(query.levels, [1]);
  assert.equal(query.q, "flute");
  assert.equal(query.sort, "recent");
  assert.deepEqual(parseSearchQuery(serializeSearchQuery(query)), query);
});

test("Q10 public direct ID and query never expose synthetic or legacy data", async () => {
  const repo = createPrototypeRepository({ storage: null });
  await repo.initialize();
  assert.equal((await repo.listResources({}, "public")).length, 0);
  assert.equal((await repo.listResources({}, "demo")).length, 8);
  await assert.rejects(
    repo.getResource("demo-violin-textbook", undefined, "public"),
    { code: "not_allowed" },
  );
  await assert.rejects(
    repo.getResource(LEGACY_MANIFEST[0].id, undefined, "public"),
    { code: "not_found" },
  );
});

test("D02 publication requires matching approved version, rights evidence and no major issue", () => {
  const data = createSeed();
  const resource = {
    ...data.resources[0],
    datasetKind: "reviewed_real" as const,
  };
  const version = data.versions[0];
  assert.equal(canPublish(version, resource, [], data.units), true);
  for (const patch of [
    { publicationState: "private" as const },
    { publishedVersionId: "wrong-version" },
    { sourceRefs: [] },
  ])
    assert.equal(
      canPublish(version, { ...resource, ...patch }, [], data.units),
      false,
    );
  assert.equal(
    canPublish({ ...version, approvedAt: null }, resource, []),
    false,
  );
  assert.equal(
    canPublish(
      { ...version, rights: { ...version.rights, allowView: false } },
      resource,
      [],
    ),
    false,
  );
  const issue = {
    ...issueFor(),
    id: "issue",
    status: "fixed" as const,
    resolution: "고침",
    dismissalReason: null,
  };
  assert.equal(canPublish(version, resource, [issue]), false);
  assert.equal(
    canPublish(version, resource, [{ ...issue, status: "verified" }]),
    true,
  );
  assert.ok(
    publishBlockers(version, data.resources[0], []).some((reason) =>
      reason.includes("합성"),
    ),
  );
});

test("D03 URL policy preserves Bb fragment and rejects scripts, credentials and deceptive hosts", () => {
  assert.equal(validateAppUrl(APP_URLS[22]), APP_URLS[22]);
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hi",
    "http://violin-edu.vercel.app/",
    "https://violin-edu.vercel.app.evil.test/",
    "https://user:password@violin-edu.vercel.app/",
    "https://127.0.0.1/",
    "https://violin-edu.vercel.app:8443/",
  ])
    assert.throws(() => validateAppUrl(url), { code: "validation_error" });
});

test("D03 unchecked apps remain disabled; mismatched instrument systems cannot be enabled", async () => {
  const repo = createPrototypeRepository({ storage: null });
  await repo.initialize();
  const app = repo.snapshot().apps[22];
  assert.equal(canOpenApp(app), false);
  assert.ok(appBlockers(app).length);
  await assert.rejects(repo.authorizeApp(app.id), { code: "not_allowed" });
  await assert.rejects(
    repo.updateApp({ ...app, instrumentSystem: "클라리미니" }),
    { code: "validation_error" },
  );
  await assert.rejects(
    repo.updateApp({ ...app, url: repo.snapshot().apps[0].url }),
    { code: "validation_error" },
  );
  await assert.rejects(repo.updateApp({ ...app, enabled: true }), {
    code: "not_allowed",
  });
});

test("D04 local storage keeps bookmarks, reading location and plans after a fresh repository", async () => {
  const storage = memoryStorage();
  const repo = createPrototypeRepository({ storage });
  await repo.initialize();
  const resource = repo.snapshot().resources[0];
  const version = repo.snapshot().versions[0];
  const asset = repo.snapshot().readingAssets[0];
  await repo.toggleBookmark({
    resourceId: resource.id,
    versionId: version.id,
    unitId: version.unitIds[0],
  });
  await repo.recordBookPosition({
    projectId: "classical-library",
    resourceId: resource.id,
    resourceVersionId: version.id,
    assetId: asset.id,
    pageNumber: null,
    unitId: version.unitIds[1],
    updatedAt: new Date().toISOString(),
  });
  const plan = {
    ...repo.snapshot().plans[0],
    title: "새로고침 뒤 보존하는 교안",
  };
  await repo.saveLessonPlan(plan, plan.revision);
  const next = createPrototypeRepository({ storage });
  await next.initialize();
  assert.equal(next.snapshot().bookmarks.length, 1);
  assert.equal(next.snapshot().positions[0].unitId, version.unitIds[1]);
  assert.equal(
    next.snapshot().plans.find((entry) => entry.id === plan.id)?.title,
    plan.title,
  );
});

test("D04 corrupt or unsupported storage recovers without overwriting the stored source", async () => {
  for (const value of [
    "{broken",
    JSON.stringify({ schemaVersion: 99, data: {} }),
    JSON.stringify({ schemaVersion: 1, revision: 0, data: { resources: [] } }),
  ]) {
    const storage = memoryStorage(value);
    const repo = createPrototypeRepository({ storage });
    await repo.initialize();
    assert.equal(repo.snapshot().storageMode, "memory");
    assert.ok(repo.snapshot().storageNotice);
    assert.equal(storage.values.get(STORAGE_KEY), value);
    assert.equal(repo.snapshot().plans.length, 4);
  }
});

test("D04 blocked persistence reports storage_unavailable and retains only an explicit memory copy", async () => {
  const storage: StorageAdapter = {
    getItem: () => null,
    setItem: () => {
      throw new Error("quota");
    },
    removeItem: () => {},
  };
  const repo = createPrototypeRepository({ storage });
  await repo.initialize();
  const plan = repo.snapshot().plans[0];
  await assert.rejects(
    repo.saveLessonPlan({ ...plan, title: "임시 복사" }, plan.revision),
    { code: "storage_unavailable" },
  );
  assert.equal(repo.snapshot().storageMode, "memory");
  assert.equal(
    repo.snapshot().plans.find((entry) => entry.id === plan.id)?.title,
    "임시 복사",
  );
});

test("D04 two tabs and stale revisions reject overwrites, reset cancel preserves state", async () => {
  const storage = memoryStorage();
  const first = createPrototypeRepository({ storage });
  const second = createPrototypeRepository({ storage });
  await first.initialize();
  await second.initialize();
  const plan = first.snapshot().plans[0];
  await first.saveLessonPlan({ ...plan, title: "첫 탭" }, plan.revision);
  await assert.rejects(
    second.saveLessonPlan({ ...plan, title: "둘째 탭" }, plan.revision),
    { code: "conflict" },
  );
  await assert.rejects(
    first.saveLessonPlan({ ...plan, title: "오래된 수정" }, plan.revision),
    { code: "conflict" },
  );
  await first.reset(false);
  assert.equal(
    first.snapshot().plans.find((entry) => entry.id === plan.id)?.title,
    "첫 탭",
  );
  await first.reset(true);
  assert.equal(
    first.snapshot().plans.find((entry) => entry.id === plan.id)?.title,
    plan.title,
  );
});

test("D05 all four plans have valid 40 minute allocation; invalid totals and fractions are rejected", () => {
  const data = createSeed();
  assert.equal(data.plans.length, 4);
  for (const plan of data.plans) {
    assert.equal(planSchema.safeParse(plan).success, true);
    assert.deepEqual(
      plan.activities.map((activity) => activity.minutes),
      [5, 10, 15, 10],
    );
    assert.equal(planWarnings(plan, data).length, 0);
  }
  assert.equal(
    planSchema.safeParse({ ...data.plans[0], durationMinutes: 45 }).success,
    false,
  );
  assert.equal(
    planSchema.safeParse({
      ...data.plans[0],
      activities: data.plans[0].activities.map((activity) => ({
        ...activity,
        minutes: 1.5,
      })),
    }).success,
    false,
  );
});

test("D06 approved versions are immutable and new drafts never inherit approval or replace plan references", async () => {
  const repo = createPrototypeRepository({ storage: null });
  await repo.initialize();
  const previous = repo.snapshot().versions[0];
  const before = JSON.stringify(previous);
  const plan = repo.snapshot().plans[0];
  const next = await repo.reviseResource(
    previous.resourceId,
    "중립 문구 개정 시연",
    previous.revision,
  );
  assert.notEqual(next.id, previous.id);
  assert.equal(next.reviewState, "draft");
  assert.equal(next.approvedAt, null);
  assert.equal(next.approvedBy, null);
  assert.equal(next.approvalEvidenceRef, null);
  assert.equal(
    JSON.stringify(
      repo.snapshot().versions.find((entry) => entry.id === previous.id),
    ),
    before,
  );
  assert.equal(
    repo.snapshot().plans.find((entry) => entry.id === plan.id)?.activities[1]
      .resources[0].versionId,
    previous.id,
  );
  assert.ok(
    planWarnings(plan, repo.snapshot()).some((warning) =>
      warning.includes("새 판본"),
    ),
  );
  await assert.rejects(
    repo.updateUnit(
      repo.snapshot().units.find((unit) => unit.id === previous.unitIds[0])!,
    ),
    { code: "not_allowed" },
  );
});

test("D06 review actions enforce role, sequence and idempotent command IDs", async () => {
  const repo = createPrototypeRepository({ storage: null });
  await repo.initialize();
  const draft = repo
    .snapshot()
    .versions.find((version) => version.id === "demo-violin-review-v1")!;
  await assert.rejects(
    repo.transitionReview(
      {
        resourceId: draft.resourceId,
        versionId: draft.id,
        to: "approved",
        actorId: "demo-reviewer",
        role: "reviewer",
        reason: "불가 전이",
      },
      draft.revision,
    ),
    { code: "not_allowed" },
  );
  const command = {
    resourceId: draft.resourceId,
    versionId: draft.id,
    to: "in_review" as const,
    actorId: "demo-editor",
    role: "editor",
    reason: "합성 검수 의뢰",
    commandId: "same-request",
  };
  const next = await repo.transitionReview(command, draft.revision);
  await repo.transitionReview(command, draft.revision);
  assert.equal(repo.snapshot().reviewEvents.length, 1);
  await assert.rejects(
    repo.transitionReview({ ...command, versionId: "different-version" }, 1),
    { code: "conflict" },
  );
  await assert.rejects(
    repo.transitionReview(
      { ...command, to: "approved", commandId: "approval" },
      next.revision,
    ),
    { code: "not_allowed" },
  );
  const approved = await repo.transitionReview(
    {
      ...command,
      to: "approved",
      actorId: "demo-reviewer",
      role: "reviewer",
      commandId: "approval",
    },
    next.revision,
  );
  assert.equal(approved.reviewState, "approved");
  assert.equal(approved.approvalEvidenceRef, "local:demo-workflow-only");
  const resource = repo
    .snapshot()
    .resources.find((entry) => entry.id === draft.resourceId)!;
  await assert.rejects(repo.publishResource(resource.id, resource.revision), {
    code: "not_allowed",
  });
});

test("D06 revision submit requires each issue response and reviewer verification stays separate", async () => {
  const repo = createPrototypeRepository({ storage: null });
  await repo.initialize();
  const old = repo
    .snapshot()
    .versions.find((version) => version.id === "demo-flute-review-v1")!;
  const revised = await repo.reviseResource(
    old.resourceId,
    "지적 반영용 새 판본",
    old.revision,
  );
  const command = {
    resourceId: old.resourceId,
    versionId: revised.id,
    to: "re_review" as const,
    actorId: "demo-editor",
    role: "editor",
    reason: "수정 응답 제출",
  };
  await assert.rejects(repo.transitionReview(command, revised.revision), {
    code: "not_allowed",
  });
  const issue = repo
    .snapshot()
    .issues.find((entry) => entry.versionId === revised.id)!;
  await repo.resolveIssue(issue.id, "fixed", "확인 목록 제목 수정");
  await assert.rejects(
    repo.resolveIssue(issue.id, "verified", "재확인", "editor"),
    { code: "not_allowed" },
  );
  const next = await repo.transitionReview(command, revised.revision);
  assert.equal(next.reviewState, "re_review");
  await repo.resolveIssue(
    issue.id,
    "verified",
    "가상 검수자 재확인",
    "reviewer",
  );
});

test("D07 safety issue holds publication and blocks direct asset, bookmark and plan reference addition", async () => {
  const repo = createPrototypeRepository({ storage: null });
  await repo.initialize();
  const resource = repo.snapshot().resources[0];
  const version = repo.snapshot().versions[0];
  const asset = repo.snapshot().readingAssets[0];
  await repo.reportIssue(issueFor(resource.id, version.id));
  assert.equal(repo.snapshot().resources[0].publicationState, "on_hold");
  await assert.rejects(repo.getResource(resource.id, version.id), {
    code: "not_allowed",
  });
  await assert.rejects(
    repo.authorizeAsset(resource.id, version.id, asset.id, "print"),
    { code: "not_allowed" },
  );
  await assert.rejects(
    repo.toggleBookmark({
      resourceId: resource.id,
      versionId: version.id,
      unitId: null,
    }),
    { code: "not_allowed" },
  );
  assert.ok(
    planWarnings(repo.snapshot().plans[0], repo.snapshot()).some((warning) =>
      warning.includes("보류"),
    ),
  );
  const issue = repo.snapshot().issues.at(-1)!;
  await assert.rejects(
    repo.resolveIssue(issue.id, "dismissed", "편집자 임의 무시"),
    { code: "not_allowed" },
  );
});

test("D08 print/download rights and file availability are enforced in policy and commands", async () => {
  const data: RepositoryData = createSeed();
  const resource = data.resources[0];
  const version = data.versions[0];
  const asset = data.readingAssets[0];
  assert.equal(canPrint(resource, version, asset), true);
  assert.equal(canDownload(resource, version, asset), false);
  assert.equal(
    canPrint(resource, version, {
      ...asset,
      rights: { ...asset.rights, allowPrint: false },
    }),
    false,
  );
  const repo = createPrototypeRepository({ storage: null });
  await repo.initialize();
  await assert.rejects(
    repo.authorizeAsset(resource.id, version.id, asset.id, "download"),
    { code: "not_allowed" },
  );
});

test("D09 reading location never crosses project/version or pretends structured units are PDF pages", async () => {
  const repo = createPrototypeRepository({ storage: null });
  await repo.initialize();
  const resource = repo.snapshot().resources[0];
  const version = repo.snapshot().versions[0];
  const asset = repo.snapshot().readingAssets[0];
  const position = {
    projectId: "classical-library" as const,
    resourceId: resource.id,
    resourceVersionId: version.id,
    assetId: asset.id,
    pageNumber: null,
    unitId: version.unitIds[0],
    updatedAt: new Date().toISOString(),
  };
  await assert.rejects(
    repo.recordBookPosition({ ...position, projectId: "gugak-library" }),
    { code: "not_allowed" },
  );
  await assert.rejects(
    repo.recordBookPosition({ ...position, pageNumber: 3 }),
    { code: "validation_error" },
  );
  assert.notEqual(
    bookPositionKey(position),
    bookPositionKey({ ...position, resourceVersionId: "new-version" }),
  );
});

test("D10 structured text stays plain text; unsafe media and malformed input fail validation", () => {
  const data = createSeed();
  data.units[0].blocks[0].text = '<script>alert("plain text")</script>';
  assert.equal(dataSchema.safeParse(data).success, true);
  data.units[0].blocks.push({
    id: "unsafe",
    type: "image",
    src: "javascript:alert(1)",
    alt: "금지된 미디어",
  });
  assert.equal(dataSchema.safeParse(data).success, false);
  data.units[0].blocks.at(-1)!.src =
    "/demo/../../textbooks/violin/page-001.svg";
  assert.equal(dataSchema.safeParse(data).success, false);
});

test("D11 snapshots cannot mutate repository state outside command methods", async () => {
  const repo = createPrototypeRepository({ storage: null });
  await repo.initialize();
  assert.throws(() => {
    repo.snapshot().resources[0].title = "직접 수정";
  });
  assert.throws(() => {
    repo.snapshot().reviewEvents.push({} as never);
  });
});

test("D12 approved synthetic workflow requires independent rights clearing before explicit demo publication", async () => {
  const repo = createPrototypeRepository({ storage: null });
  await repo.initialize();
  const version = repo
    .snapshot()
    .versions.find((entry) => entry.id === "demo-cello-review-v1")!;
  const approved = await repo.transitionReview(
    {
      resourceId: version.resourceId,
      versionId: version.id,
      to: "approved",
      actorId: "demo-reviewer",
      role: "reviewer",
      reason: "승인 절차만 시연",
    },
    version.revision,
  );
  const resource = repo
    .snapshot()
    .resources.find((entry) => entry.id === version.resourceId)!;
  await assert.rejects(
    repo.publishDemoResource(resource.id, resource.revision),
    { code: "not_allowed" },
  );
  assert.equal((await repo.listResources()).length, 8);
  await repo.updateRights(
    approved.id,
    repo.snapshot().versions[0].rights,
    approved.revision,
  );
  await repo.publishDemoResource(resource.id, resource.revision);
  assert.equal((await repo.listResources()).length, 9);
  assert.equal((await repo.listResources({}, "public")).length, 0);
  assert.equal(
    repo.snapshot().resources.find((entry) => entry.id === resource.id)
      ?.demoShelf,
    true,
  );
});

test("D13 asset editors cannot fabricate PDF files, unchecked provided covers or extra rights", async () => {
  const repo = createPrototypeRepository({ storage: null });
  await repo.initialize();
  const asset = repo.snapshot().readingAssets[0];
  const presentation = repo.snapshot().bookPresentations[0];
  await assert.rejects(
    repo.updateReadingAsset({
      ...asset,
      format: "pdf",
      fileRef: "/demo/pretend.pdf",
      pageCount: 3,
      checksum: "invented",
    }),
    { code: "not_allowed" },
  );
  await assert.rejects(
    repo.updateReadingAsset({
      ...asset,
      rights: { ...asset.rights, allowDownload: true },
    }),
    { code: "not_allowed" },
  );
  await assert.rejects(
    repo.updateBookPresentation({ ...presentation, coverOrigin: "provided" }),
    { code: "not_allowed" },
  );
  await repo.updateReadingAsset({ ...asset, availability: "on_hold" });
  await assert.rejects(
    repo.authorizeAsset(
      repo.snapshot().resources[0].id,
      asset.resourceVersionId,
      asset.id,
      "view",
    ),
    { code: "not_allowed" },
  );
  await repo.updateBookPresentation({
    ...presentation,
    displayTitle: "새 타이포그래피 표지 제목",
    coverOrigin: "generated_typography",
  });
  assert.equal(
    repo.snapshot().bookPresentations[0].displayTitle,
    "새 타이포그래피 표지 제목",
  );
});

test("D14 concurrent saves conflict instead of overwriting, independent bookmark commands both persist", async () => {
  const repo = createPrototypeRepository({ storage: null });
  await repo.initialize();
  const source = repo.snapshot().plans[0];
  const plan = { ...source, id: "concurrent-new-plan", revision: 0 };
  const saves = await Promise.allSettled([
    repo.saveLessonPlan(plan, 0),
    repo.saveLessonPlan({ ...plan, title: "동시 수정" }, 0),
  ]);
  assert.equal(
    saves.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.equal(
    saves.filter((result) => result.status === "rejected").length,
    1,
  );
  const version = repo.snapshot().versions[0];
  await Promise.all(
    version.unitIds.map((unitId) =>
      repo.toggleBookmark({
        resourceId: version.resourceId,
        versionId: version.id,
        unitId,
      }),
    ),
  );
  assert.equal(repo.snapshot().bookmarks.length, 2);
});

test("D15 approved educational metadata cannot change through repository commands before a new draft", async () => {
  const repo = createPrototypeRepository({ storage: null });
  await repo.initialize();
  const resource = repo.snapshot().resources[0];
  const version = repo
    .snapshot()
    .versions.find((entry) => entry.id === resource.currentDraftVersionId)!;
  const approvedSnapshot = JSON.stringify(version);
  const resourceSnapshot = JSON.stringify(resource);

  await assert.rejects(
    repo.updateResource(
      { ...resource, title: "승인 후 변경 제목" },
      resource.revision,
    ),
    { code: "not_allowed" },
  );
  await assert.rejects(
    repo.updateResource(
      {
        ...resource,
        instrument: "flute",
        instrumentSystem: "다른 악기 체계",
        objectives: ["승인 후 변경 목표"],
      },
      resource.revision,
    ),
    { code: "not_allowed" },
  );
  assert.equal(
    JSON.stringify(
      repo.snapshot().resources.find((entry) => entry.id === resource.id),
    ),
    resourceSnapshot,
  );

  const draft = await repo.reviseResource(
    resource.id,
    "교육 메타데이터 변경을 위한 재검수 초안",
    version.revision,
  );
  const revisedResource = repo
    .snapshot()
    .resources.find((entry) => entry.id === resource.id)!;
  const saved = await repo.updateResource(
    { ...revisedResource, title: "새 초안에서 수정한 제목" },
    revisedResource.revision,
  );
  assert.equal(saved.title, "새 초안에서 수정한 제목");
  assert.equal(draft.reviewState, "draft");
  assert.equal(
    JSON.stringify(
      repo.snapshot().versions.find((entry) => entry.id === version.id),
    ),
    approvedSnapshot,
  );
  assert.equal(
    repo.snapshot().plans[0].activities[1].resources[0].versionId,
    version.id,
  );
});

test("D16 recent sorting uses modification time rather than per-resource edit counts", () => {
  const source = createSeed().resources;
  const older = {
    ...source[0],
    revision: 99,
    updatedAt: "2026-10-10T08:00:00.000Z",
  };
  const newer = {
    ...source[1],
    revision: 1,
    updatedAt: "2026-10-14T08:00:00.000Z",
  };
  const undated = { ...source[2], revision: 1000 };
  delete undated.updatedAt;
  assert.deepEqual(
    searchResources([older, undated, newer], { sort: "recent" }).map(
      (resource) => resource.id,
    ),
    [newer.id, older.id, undated.id],
  );
});

test("D17 older stored resources without modification dates restore and receive real command timestamps", async () => {
  const seed = createSeed();
  for (const resource of seed.resources) delete resource.updatedAt;
  const storage = memoryStorage(
    JSON.stringify({ schemaVersion: 1, revision: 0, data: seed }),
  );
  const repo = createPrototypeRepository({ storage });
  await repo.initialize();
  assert.equal(repo.snapshot().storageMode, "local");
  const resource = repo.snapshot().resources[0];
  const version = repo
    .snapshot()
    .versions.find((entry) => entry.id === resource.currentDraftVersionId)!;
  const since = Date.now();
  await repo.reviseResource(
    resource.id,
    "수정 시각 기록을 위한 새 초안",
    version.revision,
  );
  const revised = repo
    .snapshot()
    .resources.find((entry) => entry.id === resource.id)!;
  assert.ok(Date.parse(revised.updatedAt!) >= since);
  const edited = await repo.updateResource(
    { ...revised, title: "수정 시각을 기록한 제목" },
    revised.revision,
  );
  assert.ok(Date.parse(edited.updatedAt!) >= Date.parse(revised.updatedAt!));
  const workflow = repo
    .snapshot()
    .resources.find((entry) => entry.id === "demo-clarinet-review")!;
  await repo.publishDemoResource(workflow.id, workflow.revision);
  assert.ok(
    Date.parse(
      repo.snapshot().resources.find((entry) => entry.id === workflow.id)!
        .updatedAt!,
    ) >= since,
  );

  const realFixture = createSeed();
  realFixture.resources[0].datasetKind = "reviewed_real";
  realFixture.resources[0].updatedAt = "2000-01-01T00:00:00.000Z";
  const realRepo = createPrototypeRepository({
    storage: null,
    seed: realFixture,
  });
  await realRepo.initialize();
  const realResource = realRepo.snapshot().resources[0];
  await realRepo.publishResource(realResource.id, realResource.revision);
  assert.ok(Date.parse(realRepo.snapshot().resources[0].updatedAt!) >= since);
});

test("D18 issue locations cannot refer to another version, another unit block, or an orphan block", async () => {
  const repo = createPrototypeRepository({ storage: null });
  await repo.initialize();
  const unit = repo.snapshot().units[0];
  const otherUnit = repo.snapshot().units[1];
  const foreignUnit = repo.snapshot().units[2];
  const issue = {
    ...issueFor(),
    category: "other" as const,
    severity: "minor" as const,
  };
  const beforeCount = repo.snapshot().issues.length;
  await assert.rejects(repo.reportIssue({ ...issue, unitId: foreignUnit.id }), {
    code: "validation_error",
  });
  await assert.rejects(
    repo.reportIssue({
      ...issue,
      unitId: unit.id,
      blockId: otherUnit.blocks[0].id,
    }),
    { code: "validation_error" },
  );
  await assert.rejects(
    repo.reportIssue({ ...issue, unitId: null, blockId: unit.blocks[0].id }),
    { code: "validation_error" },
  );
  assert.equal(repo.snapshot().issues.length, beforeCount);
  const saved = await repo.reportIssue({
    ...issue,
    unitId: unit.id,
    blockId: unit.blocks[0].id,
  });
  assert.equal(saved.blockId, unit.blocks[0].id);
  assert.equal(repo.snapshot().issues.length, beforeCount + 1);
});
