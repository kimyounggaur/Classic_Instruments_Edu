import { z } from "zod";
import { createSeed, DEMO_WATERMARK } from "./seed.ts";
import {
  appBlockers,
  assetBlockers,
  bookPositionKey,
  canonicalAppUrl,
  canPublish,
  demoPublishBlockers,
  reviewTransitionBlockers,
  searchResources,
  validateAppUrl,
  visibleTo,
} from "./policies.ts";
import {
  appSchema,
  assetSchema,
  dataSchema,
  integrityErrors,
  issueSchema,
  planSchema,
  positionSchema,
  presentationSchema,
  resourceSchema,
  rightsSchema,
  storedSchema,
  unitSchema,
} from "./schemas.ts";
import { RepositoryError } from "./types.ts";
import type {
  AppLink,
  Audience,
  Bookmark,
  BookPosition,
  BookPresentation,
  Instrument,
  LessonPlan,
  ReadingAsset,
  RepositoryData,
  RepositoryState,
  Resource,
  ResourceDetail,
  ResourceVersion,
  ReviewCommand,
  ReviewIssue,
  RightsRecord,
  SearchQuery,
  StorageAdapter,
  Unit,
} from "./types.ts";

export const STORAGE_KEY = "lesson-designer-library:classical-library:v1";
export const SCHEMA_VERSION = 1;
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}
function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new RepositoryError(
      "validation_error",
      result.error.issues.map((issue) => issue.message).join(" "),
    );
  return result.data;
}
const now = () => new Date().toISOString();
let sequence = 0;
const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(++sequence).toString(36)}`;
function assertData(data: RepositoryData): void {
  parse(dataSchema, data);
  const errors = integrityErrors(data);
  if (errors.length)
    throw new RepositoryError("validation_error", errors.join(" / "));
}
export interface RepositoryOptions {
  storage?: StorageAdapter | null;
  seed?: RepositoryData;
}

export class PrototypeRepository {
  private state: RepositoryState;
  private listeners = new Set<() => void>();
  private adapter: StorageAdapter | null = null;
  private persistedRevision = 0;
  private options: RepositoryOptions;
  constructor(options: RepositoryOptions = {}) {
    this.options = options;
    const seed = copy(options.seed ?? createSeed());
    assertData(seed);
    this.state = freeze({
      ...seed,
      initialized: false,
      storageMode: "loading",
      storageNotice: null,
      revision: 0,
    });
  }
  snapshot = (): RepositoryState => this.state;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private setState(state: RepositoryState): void {
    this.state = freeze(state);
    this.listeners.forEach((listener) => listener());
  }
  async initialize(): Promise<void> {
    if (this.state.initialized) return;
    let notice: string | null = null;
    try {
      this.adapter =
        this.options.storage === undefined
          ? typeof window === "undefined"
            ? null
            : window.localStorage
          : this.options.storage;
      const raw = this.adapter?.getItem(STORAGE_KEY);
      if (raw) {
        const stored = parse(storedSchema, JSON.parse(raw));
        assertData(stored.data);
        this.persistedRevision = stored.revision;
        this.setState({
          ...stored.data,
          initialized: true,
          storageMode: "local",
          storageNotice: null,
          revision: stored.revision,
        });
        return;
      }
    } catch {
      notice =
        "저장 데이터가 손상되었거나 브라우저 저장소를 사용할 수 없습니다. 원본은 덮어쓰지 않았으며 임시 메모리 모드로 복구했습니다. 초기화하려면 데이터 초기화를 확인해 주세요.";
      this.adapter = null;
    }
    this.setState({
      ...this.state,
      initialized: true,
      storageMode: this.adapter ? "local" : "memory",
      storageNotice:
        notice ??
        (this.adapter
          ? null
          : "임시 메모리 모드입니다. 새로고침하면 변경사항이 사라집니다."),
      revision: 0,
    });
  }
  private async ready(): Promise<void> {
    if (!this.state.initialized) await this.initialize();
  }
  private data(): RepositoryData {
    const {
      resources,
      versions,
      units,
      legacyEntries,
      modulePlans,
      apps,
      plans,
      bookmarks,
      positions,
      bookPresentations,
      readingAssets,
      issues,
      reviewEvents,
    } = this.state;
    return copy({
      resources,
      versions,
      units,
      legacyEntries,
      modulePlans,
      apps,
      plans,
      bookmarks,
      positions,
      bookPresentations,
      readingAssets,
      issues,
      reviewEvents,
    });
  }
  private commit(data: RepositoryData): void {
    assertData(data);
    const nextRevision = this.state.revision + 1;
    if (this.adapter) {
      try {
        const raw = this.adapter.getItem(STORAGE_KEY);
        if (raw) {
          const remote = parse(storedSchema, JSON.parse(raw));
          if (remote.revision !== this.persistedRevision)
            throw new RepositoryError(
              "conflict",
              "다른 탭에서 변경되었습니다. 새로고침 후 다시 편집하거나 내용을 복사해 주세요.",
            );
        } else if (this.persistedRevision !== 0)
          throw new RepositoryError(
            "conflict",
            "다른 탭에서 저장 데이터를 초기화했습니다. 새로고침해 주세요.",
          );
        this.adapter.setItem(
          STORAGE_KEY,
          JSON.stringify({
            schemaVersion: SCHEMA_VERSION,
            revision: nextRevision,
            data,
          }),
        );
        this.persistedRevision = nextRevision;
      } catch (error) {
        if (error instanceof RepositoryError && error.code === "conflict")
          throw error;
        this.adapter = null;
        this.setState({
          ...data,
          initialized: true,
          storageMode: "memory",
          storageNotice:
            "브라우저 저장에 실패했습니다. 변경사항은 임시 메모리에만 남아 있습니다. 내용을 복사한 뒤 다시 시도해 주세요.",
          revision: nextRevision,
        });
        throw new RepositoryError(
          "storage_unavailable",
          "브라우저 저장 실패 · 현재 변경은 임시 메모리에만 보관됩니다.",
        );
      }
    }
    this.setState({
      ...data,
      initialized: true,
      storageMode: this.adapter ? "local" : "memory",
      storageNotice: this.state.storageNotice,
      revision: nextRevision,
    });
  }
  async reload(): Promise<void> {
    this.state = freeze({ ...this.state, initialized: false });
    await this.initialize();
  }
  async listResources(
    query: SearchQuery = {},
    audience: Audience = "demo",
  ): Promise<Resource[]> {
    await this.ready();
    return copy(
      searchResources(
        this.state.resources.filter((resource) => {
          const version = this.state.versions.find(
            (entry) =>
              entry.id ===
              (audience === "admin"
                ? resource.currentDraftVersionId
                : resource.publishedVersionId),
          );
          return (
            !!version &&
            visibleTo(
              resource,
              version,
              audience,
              this.state.issues,
              this.state.units,
            )
          );
        }),
        query,
      ),
    );
  }
  async getResource(
    id: string,
    versionId?: string | null,
    audience: Audience = "demo",
  ): Promise<ResourceDetail> {
    await this.ready();
    const resource = this.state.resources.find((entry) => entry.id === id);
    if (!resource)
      throw new RepositoryError("not_found", "자료를 찾을 수 없습니다.");
    const version = this.state.versions.find(
      (entry) =>
        entry.id ===
          (versionId ??
            (audience === "admin"
              ? resource.currentDraftVersionId
              : resource.publishedVersionId)) && entry.resourceId === id,
    );
    if (!version)
      throw new RepositoryError("not_found", "해당 판본을 찾을 수 없습니다.");
    if (
      !visibleTo(
        resource,
        version,
        audience,
        this.state.issues,
        this.state.units,
      )
    )
      throw new RepositoryError(
        "not_allowed",
        resource.publicationState === "on_hold"
          ? "보류된 자료입니다. 사용을 중지하고 새 판본 안내를 확인해 주세요."
          : "현재 열람할 수 없는 판본입니다.",
      );
    return copy({
      resource,
      version,
      units: this.state.units
        .filter((unit) => unit.resourceVersionId === version.id)
        .sort((a, b) => a.order - b.order),
      assets: this.state.readingAssets.filter(
        (asset) => asset.resourceVersionId === version.id,
      ),
      presentation:
        this.state.bookPresentations.find(
          (item) =>
            item.resourceId === id && item.resourceVersionId === version.id,
        ) ?? null,
    });
  }
  async getUnit(
    resourceId: string,
    versionId: string,
    unitId: string,
    audience: Audience = "demo",
  ): Promise<Unit> {
    const detail = await this.getResource(resourceId, versionId, audience);
    const unit = detail.units.find((entry) => entry.id === unitId);
    if (!unit)
      throw new RepositoryError("not_found", "단원을 찾을 수 없습니다.");
    return unit;
  }
  async listApps(
    instrument?: Instrument,
    audience: Audience = "demo",
  ): Promise<AppLink[]> {
    await this.ready();
    return copy(
      this.state.apps.filter(
        (app) =>
          (!instrument || app.instruments.includes(instrument)) &&
          (audience === "admin" ||
            ["mvp_candidate", "common_tool"].includes(app.scope)),
      ),
    );
  }
  async authorizeApp(
    appId: string,
    resourceId?: string,
    versionId?: string,
    unitId?: string,
  ): Promise<string> {
    await this.ready();
    const app = this.state.apps.find((entry) => entry.id === appId);
    if (!app)
      throw new RepositoryError("not_found", "앱 후보를 찾을 수 없습니다.");
    const reasons = appBlockers(app);
    if (reasons.length)
      throw new RepositoryError("not_allowed", reasons.join(" "));
    if (resourceId && versionId && unitId) {
      const resource = this.state.resources.find(
        (entry) => entry.id === resourceId,
      );
      const unit = await this.getUnit(
        resourceId,
        versionId,
        unitId,
        resource?.datasetKind === "synthetic_demo" ? "demo" : "public",
      );
      if (
        !unit.appLinkIds.includes(appId) ||
        !resource ||
        !app.instruments.includes(resource.instrument)
      )
        throw new RepositoryError(
          "not_allowed",
          "현재 악기·단원과 연결된 앱이 아닙니다.",
        );
    }
    return app.url;
  }
  async authorizeAsset(
    resourceId: string,
    versionId: string,
    assetId: string,
    action: "view" | "print" | "download",
  ): Promise<void> {
    await this.ready();
    const resource = this.state.resources.find(
      (entry) => entry.id === resourceId,
    );
    const version = this.state.versions.find((entry) => entry.id === versionId);
    const asset = this.state.readingAssets.find(
      (entry) => entry.id === assetId,
    );
    if (!resource || !version || !asset)
      throw new RepositoryError("not_found", "자료 자산을 찾을 수 없습니다.");
    const reasons = assetBlockers(
      resource,
      version,
      asset,
      action,
      this.state.issues,
    );
    if (reasons.length)
      throw new RepositoryError("not_allowed", reasons.join(" "));
  }
  async saveLessonPlan(
    input: LessonPlan,
    expectedRevision: number,
  ): Promise<LessonPlan> {
    await this.ready();
    const plan = parse(planSchema, input);
    const previous = this.state.plans.find((entry) => entry.id === plan.id);
    if ((previous?.revision ?? 0) !== expectedRevision)
      throw new RepositoryError(
        "conflict",
        "교안이 변경되었습니다. 다시 불러오거나 복사본을 저장해 주세요.",
      );
    for (const activity of plan.activities)
      for (const ref of activity.resources) {
        const previousRef = previous?.activities.some((item) =>
          item.resources.some(
            (saved) =>
              saved.resourceId === ref.resourceId &&
              saved.versionId === ref.versionId &&
              saved.unitId === ref.unitId,
          ),
        );
        if (!previousRef)
          await this.getUnit(
            ref.resourceId,
            ref.versionId,
            ref.unitId,
            plan.isDemo ? "demo" : "public",
          );
      }
    if (
      (this.state.plans.find((entry) => entry.id === plan.id)?.revision ??
        0) !== expectedRevision
    )
      throw new RepositoryError(
        "conflict",
        "교안이 변경되었습니다. 다시 불러오거나 복사본을 저장해 주세요.",
      );
    const data = this.data();
    const saved = { ...plan, revision: expectedRevision + 1, updatedAt: now() };
    data.plans = [...data.plans.filter((entry) => entry.id !== plan.id), saved];
    this.commit(data);
    return copy(saved);
  }
  async createLessonPlan(instrument: Instrument): Promise<LessonPlan> {
    await this.ready();
    const template = createSeed().plans.find(
      (plan) => plan.instrument === instrument,
    );
    if (!template)
      throw new RepositoryError(
        "validation_error",
        "지원하지 않는 악기입니다.",
      );
    return this.saveLessonPlan(
      {
        ...template,
        id: newId("plan"),
        title: `${template.title} 새 교안`,
        revision: 0,
        activities: template.activities.map((activity) => ({
          ...activity,
          id: newId("activity"),
          resources: [],
        })),
      },
      0,
    );
  }
  async duplicateLessonPlan(id: string): Promise<LessonPlan> {
    await this.ready();
    const plan = this.state.plans.find((entry) => entry.id === id);
    if (!plan)
      throw new RepositoryError("not_found", "교안을 찾을 수 없습니다.");
    return this.saveLessonPlan(
      {
        ...copy(plan),
        id: newId("plan"),
        title: `${plan.title} (복사)`,
        revision: 0,
      },
      0,
    );
  }
  async deleteLessonPlan(id: string, expectedRevision?: number): Promise<void> {
    await this.ready();
    const previous = this.state.plans.find((entry) => entry.id === id);
    if (!previous)
      throw new RepositoryError("not_found", "교안을 찾을 수 없습니다.");
    if (
      expectedRevision !== undefined &&
      previous.revision !== expectedRevision
    )
      throw new RepositoryError("conflict", "교안이 변경되었습니다.");
    const data = this.data();
    data.plans = data.plans.filter((entry) => entry.id !== id);
    this.commit(data);
  }
  async toggleBookmark(bookmark: Bookmark): Promise<boolean> {
    await this.ready();
    const resource = this.state.resources.find(
      (entry) => entry.id === bookmark.resourceId,
    );
    const same = (entry: Bookmark) =>
      entry.resourceId === bookmark.resourceId &&
      entry.versionId === bookmark.versionId &&
      entry.unitId === bookmark.unitId;
    if (!this.state.bookmarks.some(same)) {
      const detail = await this.getResource(
        bookmark.resourceId,
        bookmark.versionId,
        resource?.datasetKind === "synthetic_demo" ? "demo" : "public",
      );
      if (
        bookmark.unitId &&
        !detail.units.some((unit) => unit.id === bookmark.unitId)
      )
        throw new RepositoryError(
          "validation_error",
          "북마크 단원이 해당 판본에 없습니다.",
        );
    }
    const data = this.data();
    const exists = data.bookmarks.some(same);
    if (exists) data.bookmarks = data.bookmarks.filter((entry) => !same(entry));
    else data.bookmarks.push(copy(bookmark));
    this.commit(data);
    return !exists;
  }
  async recordBookPosition(input: BookPosition): Promise<void> {
    await this.ready();
    const position = parse(positionSchema, input);
    if (position.projectId !== "classical-library")
      throw new RepositoryError(
        "not_allowed",
        "다른 프로젝트의 읽기 위치는 저장하지 않습니다.",
      );
    await this.authorizeAsset(
      position.resourceId,
      position.resourceVersionId,
      position.assetId,
      "view",
    );
    const asset = this.state.readingAssets.find(
      (entry) => entry.id === position.assetId,
    )!;
    if (
      asset.format === "pdf" &&
      (!position.pageNumber ||
        !asset.pageCount ||
        position.pageNumber > asset.pageCount)
    )
      throw new RepositoryError(
        "validation_error",
        "페이지 범위를 확인해 주세요.",
      );
    if (
      asset.format === "structured" &&
      (position.pageNumber !== null || !position.unitId)
    )
      throw new RepositoryError(
        "validation_error",
        "구조화 자료는 페이지 대신 단원으로 위치를 저장합니다.",
      );
    const data = this.data();
    data.positions = [
      ...data.positions.filter(
        (entry) => bookPositionKey(entry) !== bookPositionKey(position),
      ),
      { ...position, updatedAt: now() },
    ];
    this.commit(data);
  }
  async recordReadingPosition(input: BookPosition): Promise<void> {
    return this.recordBookPosition(input);
  }
  async transitionReview(
    command: ReviewCommand,
    expectedRevision: number,
  ): Promise<ResourceVersion> {
    await this.ready();
    const data = this.data();
    if (command.commandId) {
      const event = data.reviewEvents.find(
        (entry) => entry.commandId === command.commandId,
      );
      if (event) {
        if (
          event.versionId !== command.versionId ||
          event.resourceId !== command.resourceId ||
          event.to !== command.to
        )
          throw new RepositoryError(
            "conflict",
            "같은 요청 ID를 다른 검수 작업에 사용할 수 없습니다.",
          );
        return copy(
          data.versions.find((version) => version.id === event.versionId)!,
        );
      }
    }
    const version = data.versions.find(
      (entry) =>
        entry.id === command.versionId &&
        entry.resourceId === command.resourceId,
    );
    const resource = data.resources.find(
      (entry) => entry.id === command.resourceId,
    );
    if (!version || !resource)
      throw new RepositoryError("not_found", "검수 판본을 찾을 수 없습니다.");
    if (version.revision !== expectedRevision)
      throw new RepositoryError(
        "conflict",
        "검수 판본이 변경되었습니다. 다시 불러와 주세요.",
      );
    const reasons = reviewTransitionBlockers(
      command,
      version,
      resource,
      data.issues,
    );
    if (reasons.length)
      throw new RepositoryError("not_allowed", reasons.join(" "));
    const from = version.reviewState;
    version.reviewState = command.to;
    version.revision++;
    if (command.to === "approved") {
      version.approvedBy = "demo-reviewer";
      version.approvedAt = now();
      version.approvalEvidenceRef = "local:demo-workflow-only";
      version.reviewedAt = now();
    }
    data.reviewEvents.push({
      id: newId("review-event"),
      resourceId: resource.id,
      versionId: version.id,
      from,
      to: version.reviewState,
      actorId: command.actorId,
      role: command.role,
      reason: command.reason,
      at: now(),
      snapshotRevision: version.revision,
      ...(command.commandId ? { commandId: command.commandId } : {}),
    });
    this.commit(data);
    return copy(version);
  }
  async reviseResource(
    resourceId: string,
    summary: string,
    expectedRevision: number,
  ): Promise<ResourceVersion> {
    await this.ready();
    if (!summary.trim())
      throw new RepositoryError(
        "validation_error",
        "수정 내역을 작성해 주세요.",
      );
    const data = this.data();
    const resource = data.resources.find((entry) => entry.id === resourceId);
    if (!resource)
      throw new RepositoryError("not_found", "자료를 찾을 수 없습니다.");
    const previous = data.versions.find(
      (entry) => entry.id === resource.currentDraftVersionId,
    )!;
    if (previous.revision !== expectedRevision)
      throw new RepositoryError("conflict", "원본 판본이 변경되었습니다.");
    const id = newId(`${resource.id}-version`);
    const unitIds: string[] = [];
    for (const unitId of previous.unitIds) {
      const unit = data.units.find((entry) => entry.id === unitId)!;
      const nextId = newId("unit");
      unitIds.push(nextId);
      data.units.push({
        ...copy(unit),
        id: nextId,
        resourceVersionId: id,
        blocks: unit.blocks.map((block) => ({ ...block, id: newId("block") })),
      });
    }
    const version: ResourceVersion = {
      ...copy(previous),
      id,
      version: `${data.versions.filter((entry) => entry.resourceId === resourceId).length + 1}.0`,
      unitIds,
      basedOnVersionId: previous.id,
      reviewState:
        previous.reviewState === "changes_requested"
          ? "changes_requested"
          : "draft",
      approvedAt: null,
      approvedBy: null,
      approvalEvidenceRef: null,
      reviewedAt: null,
      reviewerDisplayName: null,
      reviewerNameConsent: false,
      revision: 1,
      changeSummary: summary.trim(),
      createdAt: now(),
    };
    data.versions.push(version);
    resource.currentDraftVersionId = id;
    resource.revision++;
    resource.updatedAt = now();
    for (const asset of data.readingAssets.filter(
      (entry) => entry.resourceVersionId === previous.id,
    ))
      data.readingAssets.push({
        ...copy(asset),
        id: newId("asset"),
        resourceVersionId: id,
        ...(asset.format === "structured"
          ? {}
          : {
              availability: "missing" as const,
              fileRef: null,
              pageCount: null,
              checksum: null,
            }),
      });
    const presentation = data.bookPresentations.find(
      (entry) => entry.resourceVersionId === previous.id,
    );
    if (presentation)
      data.bookPresentations.push({
        ...copy(presentation),
        resourceVersionId: id,
        coverAssetId: null,
      });
    const previousIssues = data.issues.filter(
      (issue) =>
        issue.versionId === previous.id &&
        ["open", "fixed"].includes(issue.status),
    );
    for (const issue of previousIssues) {
      const index = issue.unitId ? previous.unitIds.indexOf(issue.unitId) : -1;
      data.issues.push({
        ...copy(issue),
        id: newId("issue"),
        versionId: id,
        unitId: index < 0 ? null : unitIds[index],
        blockId: null,
      });
    }
    this.commit(data);
    return copy(version);
  }
  async updateResource(
    input: Resource,
    expectedRevision: number,
  ): Promise<Resource> {
    await this.ready();
    const next = parse(resourceSchema, input);
    const previous = this.state.resources.find((entry) => entry.id === next.id);
    if (!previous)
      throw new RepositoryError("not_found", "자료를 찾을 수 없습니다.");
    if (previous.revision !== expectedRevision)
      throw new RepositoryError(
        "conflict",
        "자료 메타데이터가 변경되었습니다.",
      );
    if (
      next.datasetKind !== previous.datasetKind ||
      next.currentDraftVersionId !== previous.currentDraftVersionId ||
      next.publishedVersionId !== previous.publishedVersionId ||
      next.publicationState !== previous.publicationState
    )
      throw new RepositoryError(
        "not_allowed",
        "출처 구분·판본·공개 상태는 전용 명령으로만 바꿀 수 있습니다.",
      );
    const version = this.state.versions.find(
      (entry) => entry.id === previous.currentDraftVersionId,
    );
    if (version?.reviewState === "approved")
      throw new RepositoryError(
        "not_allowed",
        "승인 자료의 교육 메타데이터는 새 초안 판본을 만든 뒤 수정해 주세요.",
      );
    const data = this.data();
    const saved = { ...next, revision: expectedRevision + 1, updatedAt: now() };
    data.resources = data.resources.map((entry) =>
      entry.id === saved.id ? saved : entry,
    );
    this.commit(data);
    return copy(saved);
  }
  async updateRights(
    versionId: string,
    rights: RightsRecord,
    expectedRevision: number,
  ): Promise<void> {
    await this.ready();
    const checked = parse(rightsSchema, rights);
    const data = this.data();
    const version = data.versions.find((entry) => entry.id === versionId);
    if (!version)
      throw new RepositoryError("not_found", "판본을 찾을 수 없습니다.");
    if (version.revision !== expectedRevision)
      throw new RepositoryError("conflict", "판본이 변경되었습니다.");
    version.rights = checked;
    version.revision++;
    this.commit(data);
  }
  async updateVersionMetadata(
    versionId: string,
    patch: Partial<
      Pick<
        ResourceVersion,
        | "reviewScope"
        | "reviewerDisplayName"
        | "reviewerNameConsent"
        | "aiUsage"
      >
    >,
    expectedRevision: number,
  ): Promise<void> {
    await this.ready();
    const validated = parse(
      z
        .object({
          reviewScope: z.string().max(10000).nullable().optional(),
          reviewerDisplayName: z.string().max(120).nullable().optional(),
          reviewerNameConsent: z.boolean().optional(),
          aiUsage: z.string().min(1).max(10000).optional(),
        })
        .strict(),
      patch,
    );
    const data = this.data();
    const version = data.versions.find((entry) => entry.id === versionId);
    if (!version)
      throw new RepositoryError("not_found", "판본을 찾을 수 없습니다.");
    if (version.revision !== expectedRevision)
      throw new RepositoryError("conflict", "판본이 변경되었습니다.");
    if (version.reviewState === "approved")
      throw new RepositoryError(
        "not_allowed",
        "승인 판본은 새 초안으로 개정해 주세요.",
      );
    Object.assign(version, validated);
    version.revision++;
    this.commit(data);
  }
  async updateUnit(input: Unit, expectedRevision?: number): Promise<void> {
    await this.ready();
    const unit = parse(unitSchema, input);
    const data = this.data();
    const previous = data.units.find((entry) => entry.id === unit.id);
    const version = data.versions.find(
      (entry) => entry.id === unit.resourceVersionId,
    );
    if (
      !previous ||
      !version ||
      previous.resourceVersionId !== unit.resourceVersionId
    )
      throw new RepositoryError("not_found", "단원 판본을 찾을 수 없습니다.");
    if (expectedRevision !== undefined && version.revision !== expectedRevision)
      throw new RepositoryError("conflict", "판본이 변경되었습니다.");
    if (version.reviewState === "approved")
      throw new RepositoryError(
        "not_allowed",
        "승인된 단원은 새 초안 판본을 만들어 수정해 주세요.",
      );
    const resource = data.resources.find(
      (entry) => entry.id === version.resourceId,
    )!;
    for (const appId of unit.appLinkIds) {
      const app = data.apps.find((entry) => entry.id === appId);
      if (
        !app ||
        !app.instruments.includes(resource.instrument) ||
        app.scope === "excluded_mismatch"
      )
        throw new RepositoryError(
          "validation_error",
          "단원과 다른 악기·체계의 앱은 연결할 수 없습니다.",
        );
    }
    data.units = data.units.map((entry) =>
      entry.id === unit.id ? unit : entry,
    );
    version.revision++;
    this.commit(data);
  }
  async publishResource(
    resourceId: string,
    expectedRevision: number,
  ): Promise<void> {
    await this.ready();
    const data = this.data();
    const resource = data.resources.find((entry) => entry.id === resourceId);
    if (!resource)
      throw new RepositoryError("not_found", "자료를 찾을 수 없습니다.");
    if (resource.revision !== expectedRevision)
      throw new RepositoryError("conflict", "자료가 변경되었습니다.");
    const version = data.versions.find(
      (entry) => entry.id === resource.currentDraftVersionId,
    )!;
    const candidate = {
      ...resource,
      publishedVersionId: version.id,
      publicationState: "published" as const,
    };
    if (!canPublish(version, candidate, data.issues, data.units))
      throw new RepositoryError(
        "not_allowed",
        resource.datasetKind === "synthetic_demo"
          ? `${DEMO_WATERMARK}. 실자료 공개는 할 수 없습니다.`
          : "승인·권리·메타데이터·중대 지적을 확인해야 합니다.",
      );
    Object.assign(resource, candidate, {
      revision: resource.revision + 1,
      updatedAt: now(),
    });
    this.commit(data);
  }
  async publishDemoResource(
    resourceId: string,
    expectedRevision: number,
  ): Promise<void> {
    await this.ready();
    const data = this.data();
    const resource = data.resources.find((entry) => entry.id === resourceId);
    if (!resource)
      throw new RepositoryError("not_found", "자료를 찾을 수 없습니다.");
    if (resource.revision !== expectedRevision)
      throw new RepositoryError("conflict", "자료가 변경되었습니다.");
    const version = data.versions.find(
      (entry) => entry.id === resource.currentDraftVersionId,
    )!;
    const reasons = demoPublishBlockers(
      version,
      resource,
      data.issues,
      data.units,
    );
    if (reasons.length)
      throw new RepositoryError("not_allowed", reasons.join(" "));
    resource.publicationState = "published";
    resource.publishedVersionId = version.id;
    resource.demoShelf = true;
    resource.revision++;
    resource.updatedAt = now();
    this.commit(data);
  }
  async updateBookPresentation(input: BookPresentation): Promise<void> {
    await this.ready();
    const presentation = parse(presentationSchema, input);
    const data = this.data();
    const previous = data.bookPresentations.find(
      (entry) =>
        entry.resourceId === presentation.resourceId &&
        entry.resourceVersionId === presentation.resourceVersionId,
    );
    if (
      !data.versions.some(
        (entry) =>
          entry.id === presentation.resourceVersionId &&
          entry.resourceId === presentation.resourceId,
      )
    )
      throw new RepositoryError(
        "not_found",
        "책의 자료 판본을 찾을 수 없습니다.",
      );
    if (
      presentation.coverAssetId !== (previous?.coverAssetId ?? null) ||
      (presentation.coverOrigin === "provided" &&
        previous?.coverOrigin !== "provided")
    )
      throw new RepositoryError(
        "not_allowed",
        "검사된 제공 표지가 없습니다. 타이포그래피 표지 또는 표지 없음만 선택해 주세요.",
      );
    if (previous) Object.assign(previous, presentation);
    else data.bookPresentations.push(presentation);
    this.commit(data);
  }
  async updateReadingAsset(input: ReadingAsset): Promise<void> {
    await this.ready();
    const asset = parse(assetSchema, input);
    const data = this.data();
    const previous = data.readingAssets.find((entry) => entry.id === asset.id);
    const version = data.versions.find(
      (entry) => entry.id === asset.resourceVersionId,
    );
    if (!previous || !version)
      throw new RepositoryError("not_found", "열람 자산을 찾을 수 없습니다.");
    if (
      ["resourceVersionId", "format", "fileRef", "pageCount", "checksum"].some(
        (key) =>
          asset[key as keyof ReadingAsset] !==
          previous[key as keyof ReadingAsset],
      )
    )
      throw new RepositoryError(
        "not_allowed",
        "실제 파일 검사 없이 형식·경로·페이지·체크섬을 변경할 수 없습니다.",
      );
    if (
      asset.format !== "structured" &&
      asset.availability === "available" &&
      previous.availability !== "available"
    )
      throw new RepositoryError(
        "not_allowed",
        "파일과 페이지 검사가 끝난 자산만 준비 완료로 바꿀 수 있습니다.",
      );
    if (
      (asset.rights.allowView && !version.rights.allowView) ||
      (asset.rights.allowPrint && !version.rights.allowPrint) ||
      (asset.rights.allowDownload && !version.rights.allowDownload)
    )
      throw new RepositoryError(
        "not_allowed",
        "자산의 권한은 해당 판본에 확인된 권한을 넘을 수 없습니다.",
      );
    if (asset.format === "structured" && asset.rights.allowDownload)
      throw new RepositoryError(
        "not_allowed",
        "구조화 자료에는 다운로드 파일이 없습니다.",
      );
    Object.assign(previous, asset);
    this.commit(data);
  }
  async reportIssue(
    input: Omit<
      ReviewIssue,
      "id" | "status" | "resolution" | "dismissalReason"
    >,
  ): Promise<ReviewIssue> {
    await this.ready();
    const issue = parse(issueSchema, {
      ...input,
      id: newId("issue"),
      status: "open",
      resolution: null,
      dismissalReason: null,
    });
    const data = this.data();
    const resource = data.resources.find(
      (entry) => entry.id === issue.resourceId,
    );
    const version = data.versions.find(
      (entry) =>
        entry.id === issue.versionId && entry.resourceId === issue.resourceId,
    );
    if (!resource || !version)
      throw new RepositoryError("not_found", "신고할 판본이 없습니다.");
    const unit = issue.unitId
      ? data.units.find(
          (entry) =>
            entry.id === issue.unitId && entry.resourceVersionId === version.id,
        )
      : null;
    if (
      (issue.unitId && !unit) ||
      (issue.blockId &&
        (!unit || !unit.blocks.some((block) => block.id === issue.blockId)))
    )
      throw new RepositoryError(
        "validation_error",
        "신고 위치의 단원과 블록은 선택한 자료 판본에 속해야 합니다.",
      );
    data.issues.push(issue);
    if (
      resource.publishedVersionId === version.id &&
      (issue.category === "safety" ||
        (issue.category === "music" &&
          ["critical", "major"].includes(issue.severity)) ||
        issue.severity === "critical")
    ) {
      resource.publicationState = "on_hold";
      resource.revision++;
      resource.updatedAt = now();
    }
    this.commit(data);
    return copy(issue);
  }
  async resolveIssue(
    id: string,
    status: ReviewIssue["status"],
    resolution: string,
    role = "editor",
  ): Promise<void> {
    await this.ready();
    const data = this.data();
    const issue = data.issues.find((entry) => entry.id === id);
    if (!issue) throw new RepositoryError("not_found", "검토 의견이 없습니다.");
    if (!resolution.trim())
      throw new RepositoryError(
        "validation_error",
        "처리 근거 또는 수정 응답이 필요합니다.",
      );
    if (
      status === "verified" &&
      (role !== "reviewer" || issue.status !== "fixed")
    )
      throw new RepositoryError(
        "not_allowed",
        "수정 완료 의견을 검수자가 재확인해야 합니다.",
      );
    if (
      status === "dismissed" &&
      (issue.category === "safety" ||
        (issue.category === "music" && issue.severity !== "minor")) &&
      role !== "reviewer"
    )
      throw new RepositoryError(
        "not_allowed",
        "안전·핵심 음악 지적은 편집자가 단독으로 기각할 수 없습니다.",
      );
    if (!["fixed", "verified", "dismissed"].includes(status))
      throw new RepositoryError(
        "not_allowed",
        "허용되지 않는 처리 상태입니다.",
      );
    issue.status = status;
    issue.resolution = resolution.trim();
    issue.dismissalReason = status === "dismissed" ? resolution.trim() : null;
    this.commit(data);
  }
  async updateApp(input: AppLink): Promise<void> {
    await this.ready();
    const app = parse(appSchema, input);
    validateAppUrl(app.url);
    if (
      this.state.apps.some(
        (entry) =>
          entry.id !== app.id &&
          canonicalAppUrl(entry.url) === canonicalAppUrl(app.url),
      )
    )
      throw new RepositoryError(
        "validation_error",
        "이미 등록된 앱 URL입니다.",
      );
    if (
      app.instruments.includes("clarinet") &&
      app.scope !== "common_tool" &&
      (app.instrumentSystem !== "표준 Bb 보엠식" ||
        /clarii-fingering-correction|clarimini-fingering-edu|sax-fingering-coach/.test(
          app.url,
        ))
    )
      throw new RepositoryError(
        "validation_error",
        "표준 Bb 보엠식 클라리넷과 맞지 않는 체계입니다.",
      );
    if (app.enabled && appBlockers(app).length)
      throw new RepositoryError("not_allowed", appBlockers(app).join(" "));
    const data = this.data();
    if (!data.apps.some((entry) => entry.id === app.id))
      throw new RepositoryError("not_found", "기존 후보를 찾을 수 없습니다.");
    data.apps = data.apps.map((entry) => (entry.id === app.id ? app : entry));
    this.commit(data);
  }
  async reset(confirmed: boolean): Promise<void> {
    await this.ready();
    if (!confirmed) return;
    try {
      const adapter =
        this.options.storage === undefined
          ? typeof window === "undefined"
            ? null
            : window.localStorage
          : this.options.storage;
      adapter?.removeItem(STORAGE_KEY);
      this.adapter = adapter;
    } catch {
      this.adapter = null;
    }
    this.persistedRevision = 0;
    this.setState({
      ...copy(this.options.seed ?? createSeed()),
      initialized: true,
      revision: 0,
      storageMode: this.adapter ? "local" : "memory",
      storageNotice: this.adapter
        ? null
        : "임시 메모리 모드입니다. 새로고침하면 변경사항이 사라집니다.",
    });
  }
}
export const createPrototypeRepository = (options: RepositoryOptions = {}) =>
  new PrototypeRepository(options);
export const repository = createPrototypeRepository();
