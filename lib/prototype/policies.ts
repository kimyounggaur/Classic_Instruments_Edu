import { APP_URLS } from "./seed.ts";
import { INSTRUMENTS, instrumentLabels, RepositoryError } from "./types.ts";
import type {
  AppLink,
  Audience,
  BookPosition,
  Instrument,
  LessonPlan,
  ReadingAsset,
  RepositoryData,
  Resource,
  ResourceKind,
  ResourceVersion,
  ReviewCommand,
  ReviewIssue,
  ReviewState,
  SearchQuery,
  Unit,
} from "./types.ts";

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/플룻/g, "플루트")
    .replace(/\s+/g, " ");
}
export function parseSearchQuery(input: string | URLSearchParams): SearchQuery {
  const params =
    typeof input === "string"
      ? new URLSearchParams(input.replace(/^\?/, ""))
      : input;
  const values = (plural: string, singular: string) =>
    [...params.getAll(plural), ...params.getAll(singular)]
      .flatMap((value) => value.split(","))
      .filter(Boolean);
  return {
    q: normalizeSearch(params.get("q") ?? ""),
    instruments: values("instruments", "instrument").filter(
      (value): value is Instrument => INSTRUMENTS.includes(value as Instrument),
    ),
    kinds: values("kinds", "kind").filter((value): value is ResourceKind =>
      ["textbook", "score", "diagram", "activity"].includes(value),
    ),
    levels: values("levels", "level")
      .map(Number)
      .filter((value) => [1, 2, 3].includes(value)),
    objectives: values("objectives", "objective").map(normalizeSearch),
    topics: values("topics", "topic").map(normalizeSearch),
    sort: params.get("sort") === "recent" ? "recent" : "title",
  };
}
export function serializeSearchQuery(query: SearchQuery): string {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", normalizeSearch(query.q));
  for (const key of [
    "instruments",
    "kinds",
    "levels",
    "objectives",
    "topics",
  ] as const)
    for (const value of query[key] ?? []) params.append(key, String(value));
  if (query.sort && query.sort !== "title") params.set("sort", query.sort);
  return params.toString();
}
export function searchResources(
  resources: Resource[],
  query: SearchQuery = {},
): Resource[] {
  const terms = normalizeSearch(query.q ?? "")
    .split(" ")
    .filter(Boolean);
  const modifiedTime = (resource: Resource) => {
    const timestamp = Date.parse(resource.updatedAt ?? "");
    return Number.isFinite(timestamp) ? timestamp : 0;
  };
  return resources
    .filter((resource) => {
      const haystack = normalizeSearch(
        [
          resource.title,
          resource.description,
          resource.instrument,
          instrumentLabels[resource.instrument],
          ...resource.topics,
          ...resource.objectives,
        ].join(" "),
      );
      return (
        terms.every((term) => haystack.includes(term)) &&
        (!query.instruments?.length ||
          query.instruments.includes(resource.instrument)) &&
        (!query.kinds?.length || query.kinds.includes(resource.kind)) &&
        (!query.levels?.length || query.levels.includes(resource.level)) &&
        (!query.objectives?.length ||
          query.objectives.some((term) =>
            resource.objectives.some((value) =>
              normalizeSearch(value).includes(normalizeSearch(term)),
            ),
          )) &&
        (!query.topics?.length ||
          query.topics.some((term) =>
            resource.topics.some((value) =>
              normalizeSearch(value).includes(normalizeSearch(term)),
            ),
          ))
      );
    })
    .sort((left, right) =>
      query.sort === "recent"
        ? modifiedTime(right) - modifiedTime(left) ||
          left.title.localeCompare(right.title, "ko")
        : left.title.localeCompare(right.title, "ko"),
    );
}
export function unresolvedMajorIssues(
  issues: ReviewIssue[],
  versionId: string,
): ReviewIssue[] {
  return issues.filter(
    (issue) =>
      issue.versionId === versionId &&
      ["critical", "major"].includes(issue.severity) &&
      (["open", "fixed"].includes(issue.status) ||
        (issue.status === "dismissed" && !issue.dismissalReason?.trim())),
  );
}
function metadataBlockers(
  version: ResourceVersion,
  resource: Resource,
  issues: ReviewIssue[],
  units?: Unit[],
): string[] {
  const reasons: string[] = [];
  if (
    !resource.title.trim() ||
    !resource.description.trim() ||
    !resource.instrumentSystem.trim() ||
    ![1, 2, 3].includes(resource.level) ||
    !resource.objectives.some((objective) => objective.trim())
  )
    reasons.push("필수 자료 메타데이터가 누락되었습니다.");
  if (
    !resource.sourceRefs.length ||
    resource.sourceRefs.some((source) => !source.title.trim())
  )
    reasons.push("출처 정보가 필요합니다.");
  if (
    version.resourceId !== resource.id ||
    !version.unitIds.length ||
    (units &&
      version.unitIds.some(
        (id) =>
          !units.some(
            (unit) =>
              unit.id === id &&
              unit.resourceVersionId === version.id &&
              !!unit.title.trim(),
          ),
      ))
  )
    reasons.push("판본과 단원 연결을 확인해 주세요.");
  if (
    version.rights.state !== "cleared" ||
    !version.rights.allowView ||
    !version.rights.evidenceRef ||
    !version.rights.holder ||
    !version.rights.license ||
    !version.rights.checkedAt ||
    !version.rights.checkedBy
  )
    reasons.push("권리 확인과 열람 허용 증빙이 필요합니다.");
  if (unresolvedMajorIssues(issues, version.id).length)
    reasons.push("해결되지 않은 중대·주요 지적이 있습니다.");
  return reasons;
}
export function publishBlockers(
  version: ResourceVersion,
  resource: Resource,
  issues: ReviewIssue[],
  units?: Unit[],
): string[] {
  const reasons = metadataBlockers(version, resource, issues, units);
  if (resource.datasetKind !== "reviewed_real")
    reasons.push(
      "실제 검수된 자료만 실자료 공개가 가능합니다. 합성 자료는 시연 서고에서만 제공합니다.",
    );
  if (
    version.reviewState !== "approved" ||
    !version.approvedBy ||
    !version.approvedAt ||
    !version.approvalEvidenceRef ||
    !version.reviewScope?.trim()
  )
    reasons.push("해당 판본의 승인자·일시·증빙·검수 범위가 필요합니다.");
  if (
    resource.publicationState !== "published" ||
    resource.publishedVersionId !== version.id
  )
    reasons.push("승인 판본을 별도로 공개해야 합니다.");
  return reasons;
}
export function canPublish(
  version: ResourceVersion,
  resource: Resource,
  issues: ReviewIssue[] = [],
  units?: Unit[],
): boolean {
  return publishBlockers(version, resource, issues, units).length === 0;
}
export function demoPublishBlockers(
  version: ResourceVersion,
  resource: Resource,
  issues: ReviewIssue[] = [],
  units?: Unit[],
): string[] {
  const reasons = metadataBlockers(version, resource, issues, units);
  if (resource.datasetKind !== "synthetic_demo")
    reasons.push("승인 절차 시연은 합성 자료에서만 가능합니다.");
  if (
    version.reviewState !== "approved" ||
    !version.approvedAt ||
    !version.approvedBy ||
    version.approvalEvidenceRef !== "local:demo-workflow-only" ||
    !version.reviewScope?.trim()
  )
    reasons.push("합성 승인 시연 기록과 검수 범위가 필요합니다.");
  return reasons;
}
export function demoVisible(
  resource: Resource,
  version: ResourceVersion | null | undefined,
  issues: ReviewIssue[] = [],
): boolean {
  return (
    !!version &&
    resource.datasetKind === "synthetic_demo" &&
    resource.demoShelf !== false &&
    resource.publicationState === "published" &&
    resource.publishedVersionId === version.id &&
    version.reviewState === "approved" &&
    metadataBlockers(version, resource, issues).length === 0
  );
}
export function visibleTo(
  resource: Resource,
  version: ResourceVersion,
  audience: Audience,
  issues: ReviewIssue[] = [],
  units?: Unit[],
): boolean {
  return (
    audience === "admin" ||
    (audience === "demo"
      ? demoVisible(resource, version, issues)
      : canPublish(version, resource, issues, units))
  );
}

const allowedHosts = new Set(APP_URLS.map((url) => new URL(url).hostname));
export function validateAppUrl(input: string): string {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new RepositoryError(
      "validation_error",
      "올바른 HTTPS URL을 입력해 주세요.",
    );
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    !allowedHosts.has(url.hostname)
  )
    throw new RepositoryError(
      "validation_error",
      "원자료 후보의 허용된 HTTPS 호스트만 저장할 수 있습니다.",
    );
  return url.href;
}
export function canonicalAppUrl(input: string): string {
  return new URL(validateAppUrl(input)).href;
}
export function appBlockers(app: AppLink): string[] {
  const reasons: string[] = [];
  try {
    validateAppUrl(app.url);
  } catch (error) {
    reasons.push((error as Error).message);
  }
  if (!app.enabled) reasons.push("관리자가 비활성화한 후보입니다.");
  if (
    app.status !== "available" ||
    !app.checkedAt ||
    !app.checkEvidence?.trim()
  )
    reasons.push("링크 점검 일시와 증거가 필요합니다.");
  if (!app.contentAccuracyChecked)
    reasons.push("교육 내용과 악기체계 점검 전입니다.");
  if (app.requiresCamera !== "no")
    reasons.push("카메라 미사용이 확인되어야 합니다.");
  if (app.requiresLogin !== "no")
    reasons.push("로그인 없이 사용할 수 있는지 확인해야 합니다.");
  if (!["mvp_candidate", "common_tool"].includes(app.scope))
    reasons.push("현재 MVP 연결 범위에 포함되지 않습니다.");
  if (
    app.instruments.includes("clarinet") &&
    app.scope !== "common_tool" &&
    app.instrumentSystem !== "표준 Bb 보엠식"
  )
    reasons.push("표준 Bb 보엠식 체계가 확인되지 않았습니다.");
  if (
    /clarii-fingering-correction|clarimini-fingering-edu|sax-fingering-coach/.test(
      app.url,
    ) &&
    app.instruments.includes("clarinet")
  )
    reasons.push("표준 클라리넷과 다른 악기체계입니다.");
  return reasons;
}
export function canOpenApp(app: AppLink): boolean {
  return appBlockers(app).length === 0;
}
export function assetBlockers(
  resource: Resource,
  version: ResourceVersion,
  asset: ReadingAsset,
  action: "view" | "print" | "download",
  issues: ReviewIssue[] = [],
): string[] {
  const reasons: string[] = [];
  if (
    !visibleTo(
      resource,
      version,
      resource.datasetKind === "synthetic_demo" ? "demo" : "public",
      issues,
    )
  )
    reasons.push("현재 공개 열람할 수 없는 자료입니다.");
  if (
    asset.resourceVersionId !== version.id ||
    asset.availability !== "available"
  )
    reasons.push("해당 판본의 열람 자산이 준비되지 않았습니다.");
  if (
    version.rights.state !== "cleared" ||
    !version.rights.allowView ||
    !asset.rights.allowView
  )
    reasons.push("열람 권한이 없습니다.");
  if (
    action === "print" &&
    (!version.rights.allowPrint || !asset.rights.allowPrint)
  )
    reasons.push("출력 권한이 없습니다.");
  if (
    action === "download" &&
    (!version.rights.allowDownload ||
      !asset.rights.allowDownload ||
      !asset.fileRef ||
      asset.format === "structured")
  )
    reasons.push("다운로드 가능한 파일과 권한이 없습니다.");
  if (
    asset.format === "pdf" &&
    (!asset.fileRef || !asset.pageCount || !asset.checksum)
  )
    reasons.push("검사된 PDF 파일 정보가 없습니다.");
  if (asset.format === "pptx_source")
    reasons.push("PPTX 원본은 PDF 뷰어로 열 수 없습니다.");
  return reasons;
}
export const canOpenAsset = (
  resource: Resource,
  version: ResourceVersion,
  asset: ReadingAsset,
  issues: ReviewIssue[] = [],
) => assetBlockers(resource, version, asset, "view", issues).length === 0;
export const canPrint = (
  resource: Resource,
  version: ResourceVersion,
  asset: ReadingAsset,
  issues: ReviewIssue[] = [],
) => assetBlockers(resource, version, asset, "print", issues).length === 0;
export const canDownload = (
  resource: Resource,
  version: ResourceVersion,
  asset: ReadingAsset,
  issues: ReviewIssue[] = [],
) => assetBlockers(resource, version, asset, "download", issues).length === 0;
export function bookPositionKey(
  position: Pick<
    BookPosition,
    "projectId" | "resourceId" | "resourceVersionId" | "assetId"
  >,
): string {
  return [
    position.projectId,
    position.resourceId,
    position.resourceVersionId,
    position.assetId,
  ].join("/");
}
export const totalPlanMinutes = (plan: LessonPlan) =>
  plan.activities.reduce((total, activity) => total + activity.minutes, 0);
export function planWarnings(plan: LessonPlan, data: RepositoryData): string[] {
  const warnings: string[] = [];
  if (totalPlanMinutes(plan) !== plan.durationMinutes)
    warnings.push("활동 시간 합계와 전체 시간이 다릅니다.");
  for (const activity of plan.activities)
    for (const ref of activity.resources) {
      const resource = data.resources.find(
        (entry) => entry.id === ref.resourceId,
      );
      const version = data.versions.find((entry) => entry.id === ref.versionId);
      if (
        !resource ||
        !version ||
        !visibleTo(
          resource,
          version,
          plan.isDemo ? "demo" : "public",
          data.issues,
          data.units,
        )
      )
        warnings.push(
          `${resource?.title ?? ref.resourceId}: 보류되었거나 현재 사용할 수 없는 자료입니다.`,
        );
      if (resource && resource.currentDraftVersionId !== ref.versionId)
        warnings.push(
          `${resource.title}: 새 판본이 있습니다. 비교 후 직접 적용해 주세요.`,
        );
      const asset = data.readingAssets.find(
        (entry) => entry.resourceVersionId === ref.versionId,
      );
      if (
        resource &&
        version &&
        asset &&
        !canPrint(resource, version, asset, data.issues)
      )
        warnings.push(
          `${resource.title}: 본문 출력이 제한됩니다. 메타데이터만 출력합니다.`,
        );
    }
  return [...new Set(warnings)];
}
const transitions: Record<ReviewState, ReviewState[]> = {
  draft: ["in_review"],
  in_review: ["changes_requested", "approved", "rejected"],
  changes_requested: ["re_review"],
  re_review: ["changes_requested", "approved", "rejected"],
  approved: [],
  rejected: [],
};
export function reviewTransitionBlockers(
  command: ReviewCommand,
  version: ResourceVersion,
  resource: Resource,
  issues: ReviewIssue[],
): string[] {
  const reasons: string[] = [];
  if (!transitions[version.reviewState].includes(command.to))
    reasons.push("허용되지 않는 검수 상태 전이입니다.");
  if (!command.reason.trim() || !command.actorId.trim())
    reasons.push("처리자와 사유가 필요합니다.");
  if (
    ["approved", "rejected", "changes_requested"].includes(command.to) &&
    command.role !== "reviewer"
  )
    reasons.push("가상 검수자 역할에서만 처리할 수 있습니다.");
  if (
    ["in_review", "re_review"].includes(command.to) &&
    command.role !== "editor"
  )
    reasons.push("가상 편집자 역할에서 제출해 주세요.");
  if (
    !resource.sourceRefs.length ||
    !version.reviewScope?.trim() ||
    !version.unitIds.length
  )
    reasons.push("출처·단원·검수 범위를 작성해 주세요.");
  if (command.to === "approved" && resource.datasetKind !== "synthetic_demo")
    reasons.push("이 로컬 시연에서는 합성 자료의 승인 흐름만 실행합니다.");
  if (
    command.to === "approved" &&
    unresolvedMajorIssues(issues, version.id).length
  )
    reasons.push("미해결 중대 지적은 승인할 수 없습니다.");
  if (
    command.to === "changes_requested" &&
    !issues.some(
      (issue) => issue.versionId === version.id && issue.status === "open",
    )
  )
    reasons.push("위치·심각도·근거가 있는 검토 의견을 먼저 작성해 주세요.");
  if (
    command.to === "re_review" &&
    (!version.basedOnVersionId ||
      !version.changeSummary.trim() ||
      issues.some(
        (issue) => issue.versionId === version.id && issue.status === "open",
      ))
  )
    reasons.push("새 수정 판본과 지적별 수정 응답이 필요합니다.");
  return reasons;
}
