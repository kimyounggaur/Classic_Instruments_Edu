import { z } from "zod";
import type { RepositoryData } from "./types.ts";

const id = z.string().trim().min(1).max(180);
const text = z.string().trim().min(1).max(10000);
const nullableText = z.string().max(10000).nullable();
const date = z.string().datetime().nullable();
const instrument = z.enum(["violin", "cello", "flute", "clarinet"]);
const level = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const reviewState = z.enum([
  "draft",
  "in_review",
  "changes_requested",
  "re_review",
  "approved",
  "rejected",
]);
export const rightsSchema = z
  .object({
    state: z.enum(["unknown", "pending", "cleared", "restricted"]),
    holder: nullableText,
    license: nullableText,
    evidenceRef: nullableText,
    allowView: z.boolean(),
    allowPrint: z.boolean(),
    allowDownload: z.boolean(),
    allowRedistribute: z.boolean(),
    checkedAt: date,
    checkedBy: nullableText,
  })
  .strict();
export const sourceSchema = z
  .object({
    id,
    title: text,
    url: z.string().url().nullable(),
    chapter: nullableText,
    pageRange: nullableText,
    originalFieldName: z.string().optional(),
  })
  .strict();
export const resourceSchema = z
  .object({
    id,
    title: text,
    description: text,
    instrument,
    instrumentSystem: text,
    kind: z.enum(["textbook", "score", "diagram", "activity"]),
    level,
    objectives: z.array(text).min(1),
    topics: z.array(text),
    prerequisites: z.array(text),
    estimatedMinutes: z.number().int().positive().max(600),
    datasetKind: z.enum([
      "legacy_unreviewed",
      "synthetic_demo",
      "reviewed_real",
    ]),
    currentDraftVersionId: id,
    publishedVersionId: id.nullable(),
    publicationState: z.enum(["private", "published", "on_hold"]),
    sourceRefs: z.array(sourceSchema).min(1),
    legacyEntryIds: z.array(id),
    modulePlanIds: z.array(id),
    revision: z.number().int().nonnegative(),
    updatedAt: z.string().datetime().optional(),
    demoShelf: z.boolean().optional(),
  })
  .strict();
export const versionSchema = z
  .object({
    id,
    resourceId: id,
    version: text,
    reviewState,
    rights: rightsSchema,
    unitIds: z.array(id),
    aiUsage: text,
    reviewScope: nullableText,
    reviewerDisplayName: nullableText,
    reviewerNameConsent: z.boolean(),
    reviewedAt: date,
    approvedBy: nullableText,
    approvedAt: date,
    approvalEvidenceRef: nullableText,
    basedOnVersionId: id.nullable(),
    changeSummary: text,
    revision: z.number().int().nonnegative(),
    createdAt: z.string().datetime(),
  })
  .strict();
const localMedia = z
  .string()
  .regex(
    /^\/demo\/[a-zA-Z0-9/_\.\-]+$/,
    "자체 제작한 /demo 자산만 사용할 수 있습니다.",
  )
  .refine(
    (value) =>
      !value.split("/").some((segment) => segment === "." || segment === ".."),
    "자산 경로에 상위 폴더 이동을 사용할 수 없습니다.",
  );
export const unitSchema = z
  .object({
    id,
    resourceVersionId: id,
    order: z.number().int().nonnegative(),
    title: text,
    blocks: z.array(
      z
        .object({
          id,
          type: z.enum(["paragraph", "image", "score", "audio"]),
          text: z.string().max(20000).optional(),
          src: localMedia.optional(),
          alt: z.string().max(1000).optional(),
          caption: z.string().max(1000).optional(),
        })
        .strict()
        .superRefine((block, ctx) => {
          if (block.type === "paragraph" && !block.text?.trim())
            ctx.addIssue({ code: "custom", message: "본문이 필요합니다." });
          if (["image", "score"].includes(block.type) && !block.alt?.trim())
            ctx.addIssue({
              code: "custom",
              message: "이미지 대체 설명이 필요합니다.",
            });
        }),
    ),
    appLinkIds: z.array(id),
  })
  .strict();
export const appSchema = z
  .object({
    id,
    title: text,
    url: z.string().url(),
    sourceDocumentUrl: z.string().url(),
    instruments: z.array(instrument),
    instrumentSystem: nullableText,
    scope: z.enum([
      "mvp_candidate",
      "common_tool",
      "other",
      "excluded_mismatch",
    ]),
    purpose: text,
    level: level.nullable(),
    status: z.enum(["unchecked", "available", "broken", "restricted"]),
    checkedAt: date,
    checkEvidence: nullableText,
    contentAccuracyChecked: z.boolean(),
    requiresCamera: z.enum(["yes", "no", "unknown"]),
    requiresLogin: z.enum(["yes", "no", "unknown"]),
    enabled: z.boolean(),
    fallbackResourceId: id.nullable(),
  })
  .strict();
export const issueSchema = z
  .object({
    id,
    resourceId: id,
    versionId: id,
    unitId: id.nullable(),
    blockId: id.nullable(),
    category: z.enum(["music", "pedagogy", "safety", "rights", "other"]),
    severity: z.enum(["critical", "major", "minor"]),
    description: text,
    evidence: text,
    suggestion: text,
    resolution: nullableText,
    status: z.enum(["open", "fixed", "verified", "dismissed"]),
    dismissalReason: nullableText,
  })
  .strict();
export const planSchema = z
  .object({
    id,
    title: text,
    instrument,
    targetLevel: level,
    objectives: z.array(text).min(1),
    durationMinutes: z.number().int().positive().max(600),
    materials: z.array(text),
    activities: z
      .array(
        z
          .object({
            id,
            phase: z.enum(["intro", "main", "wrapup"]),
            title: text,
            minutes: z.number().int().positive().max(600),
            teacherNotes: z.string().max(10000),
            alternative: z.string().max(10000),
            resources: z.array(
              z.object({ resourceId: id, versionId: id, unitId: id }).strict(),
            ),
            appLinkIds: z.array(id),
          })
          .strict(),
      )
      .min(1),
    isDemo: z.boolean(),
    updatedAt: z.string().datetime(),
    revision: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((plan, ctx) => {
    if (
      plan.activities.reduce(
        (total, activity) => total + activity.minutes,
        0,
      ) !== plan.durationMinutes
    )
      ctx.addIssue({
        code: "custom",
        message: "활동 시간 합계와 전체 수업 시간이 같아야 합니다.",
        path: ["durationMinutes"],
      });
    const ids = plan.activities.map((activity) => activity.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: "custom", message: "활동 ID가 중복되었습니다." });
  });
export const assetSchema = z
  .object({
    id,
    resourceVersionId: id,
    format: z.enum(["pdf", "structured", "pptx_source"]),
    fileRef: localMedia.nullable(),
    pageCount: z.number().int().positive().nullable(),
    checksum: nullableText,
    availability: z.enum([
      "missing",
      "processing",
      "available",
      "failed",
      "on_hold",
    ]),
    rights: z
      .object({
        allowView: z.boolean(),
        allowPrint: z.boolean(),
        allowDownload: z.boolean(),
      })
      .strict(),
  })
  .strict()
  .superRefine((asset, ctx) => {
    if (
      asset.availability === "available" &&
      asset.format === "pdf" &&
      (!asset.fileRef || !asset.pageCount || !asset.checksum)
    )
      ctx.addIssue({
        code: "custom",
        message: "PDF 파일·실측 페이지·체크섬이 필요합니다.",
      });
  });
export const positionSchema = z
  .object({
    projectId: z.enum(["classical-library", "gugak-library"]),
    resourceId: id,
    resourceVersionId: id,
    assetId: id,
    pageNumber: z.number().int().positive().nullable(),
    unitId: id.nullable(),
    updatedAt: z.string().datetime(),
  })
  .strict();
const legacySchema = z
  .object({
    id,
    instrument,
    level,
    title: text,
    pageRange: text,
    questionCount: z.number().int().nonnegative(),
    reviewState: z.literal("draft"),
    rightsState: z.literal("unknown"),
    approvedAt: z.null(),
    body: z.null(),
  })
  .strict();
const moduleSchema = z
  .object({
    id,
    instrument,
    slot: z.union([level, z.literal(4), z.literal(5), z.literal(6)]),
    title: text,
    legacyEntryIds: z.array(id),
    mappingState: z.enum(["proposed", "reviewed"]),
  })
  .strict();
export const presentationSchema = z
  .object({
    resourceId: id,
    resourceVersionId: id,
    coverAssetId: id.nullable(),
    coverOrigin: z.enum(["provided", "generated_typography", "none"]),
    shelfOrder: z.number().int().nullable(),
    displayTitle: text,
  })
  .strict();
export const dataSchema = z
  .object({
    resources: z.array(resourceSchema),
    versions: z.array(versionSchema),
    units: z.array(unitSchema),
    legacyEntries: z.array(legacySchema),
    modulePlans: z.array(moduleSchema),
    apps: z.array(appSchema),
    plans: z.array(planSchema),
    bookmarks: z.array(
      z
        .object({ resourceId: id, versionId: id, unitId: id.nullable() })
        .strict(),
    ),
    positions: z.array(positionSchema),
    bookPresentations: z.array(presentationSchema),
    readingAssets: z.array(assetSchema),
    issues: z.array(issueSchema),
    reviewEvents: z.array(
      z
        .object({
          id,
          resourceId: id,
          versionId: id,
          from: reviewState,
          to: reviewState,
          actorId: id,
          role: text,
          reason: text,
          at: z.string().datetime(),
          snapshotRevision: z.number().int().nonnegative(),
          commandId: id.optional(),
        })
        .strict(),
    ),
  })
  .strict();
export const storedSchema = z
  .object({
    schemaVersion: z.literal(1),
    revision: z.number().int().nonnegative(),
    data: dataSchema,
  })
  .strict();

export function integrityErrors(data: RepositoryData): string[] {
  const errors: string[] = [];
  for (const key of [
    "resources",
    "versions",
    "units",
    "legacyEntries",
    "modulePlans",
    "apps",
    "plans",
    "readingAssets",
    "issues",
    "reviewEvents",
  ] as const) {
    const ids = data[key].map((entry) => entry.id);
    if (new Set(ids).size !== ids.length) errors.push(`${key}: 중복 ID`);
  }
  const resource = (id: string) =>
    data.resources.find((entry) => entry.id === id);
  const version = (id: string) =>
    data.versions.find((entry) => entry.id === id);
  const unit = (id: string) => data.units.find((entry) => entry.id === id);
  for (const item of data.resources) {
    if (version(item.currentDraftVersionId)?.resourceId !== item.id)
      errors.push(`${item.id}: 초안 판본 참조`);
    if (
      item.publishedVersionId &&
      version(item.publishedVersionId)?.resourceId !== item.id
    )
      errors.push(`${item.id}: 공개 판본 참조`);
    if (
      item.legacyEntryIds.some(
        (id) => !data.legacyEntries.some((entry) => entry.id === id),
      ) ||
      item.modulePlanIds.some(
        (id) => !data.modulePlans.some((entry) => entry.id === id),
      )
    )
      errors.push(`${item.id}: 원자료/모듈 참조`);
  }
  for (const item of data.versions) {
    if (
      !resource(item.resourceId) ||
      item.unitIds.some((id) => unit(id)?.resourceVersionId !== item.id) ||
      (item.basedOnVersionId &&
        version(item.basedOnVersionId)?.resourceId !== item.resourceId)
    )
      errors.push(`${item.id}: 판본 참조`);
  }
  for (const item of data.units)
    if (
      !version(item.resourceVersionId)?.unitIds.includes(item.id) ||
      item.appLinkIds.some((id) => !data.apps.some((app) => app.id === id))
    )
      errors.push(`${item.id}: 단원 참조`);
  for (const item of data.modulePlans)
    if (
      item.legacyEntryIds.some(
        (id) =>
          !data.legacyEntries.some(
            (entry) => entry.id === id && entry.instrument === item.instrument,
          ),
      )
    )
      errors.push(`${item.id}: 제안 매핑 참조`);
  for (const item of data.readingAssets)
    if (!version(item.resourceVersionId)) errors.push(`${item.id}: 자산 참조`);
  for (const item of data.apps)
    if (item.fallbackResourceId && !resource(item.fallbackResourceId))
      errors.push(`${item.id}: 대체 자료 참조`);
  for (const item of data.bookPresentations)
    if (
      version(item.resourceVersionId)?.resourceId !== item.resourceId ||
      (item.coverAssetId &&
        !data.readingAssets.some((asset) => asset.id === item.coverAssetId))
    )
      errors.push(`${item.resourceId}: 표지 참조`);
  for (const item of [...data.issues, ...data.reviewEvents])
    if (version(item.versionId)?.resourceId !== item.resourceId)
      errors.push(`${item.id}: 검수 참조`);
  for (const item of data.issues)
    if (
      (item.blockId && !item.unitId) ||
      (item.unitId &&
        (unit(item.unitId)?.resourceVersionId !== item.versionId ||
          (item.blockId &&
            !unit(item.unitId)?.blocks.some(
              (block) => block.id === item.blockId,
            ))))
    )
      errors.push(`${item.id}: 신고 위치`);
  for (const item of data.bookmarks)
    if (
      version(item.versionId)?.resourceId !== item.resourceId ||
      (item.unitId && unit(item.unitId)?.resourceVersionId !== item.versionId)
    )
      errors.push("북마크 참조");
  for (const item of data.positions)
    if (
      version(item.resourceVersionId)?.resourceId !== item.resourceId ||
      !data.readingAssets.some(
        (asset) =>
          asset.id === item.assetId &&
          asset.resourceVersionId === item.resourceVersionId,
      ) ||
      (item.unitId &&
        unit(item.unitId)?.resourceVersionId !== item.resourceVersionId)
    )
      errors.push("읽기 위치 참조");
  for (const plan of data.plans)
    for (const activity of plan.activities) {
      if (
        activity.resources.some(
          (ref) =>
            version(ref.versionId)?.resourceId !== ref.resourceId ||
            unit(ref.unitId)?.resourceVersionId !== ref.versionId,
        )
      )
        errors.push(`${plan.id}: 교안 판본 참조`);
      if (
        activity.appLinkIds.some(
          (id) => !data.apps.some((app) => app.id === id),
        )
      )
        errors.push(`${plan.id}: 교안 앱 참조`);
    }
  return errors;
}
