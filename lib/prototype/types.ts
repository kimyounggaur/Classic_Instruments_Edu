export const INSTRUMENTS = ["violin", "cello", "flute", "clarinet"] as const;
export type Instrument = (typeof INSTRUMENTS)[number];
export const instrumentLabels: Record<Instrument, string> = {
  violin: "바이올린",
  cello: "첼로",
  flute: "플루트",
  clarinet: "클라리넷",
};
export type ReviewState =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "re_review"
  | "approved"
  | "rejected";
export type PublicationState = "private" | "published" | "on_hold";
export type RightsState = "unknown" | "pending" | "cleared" | "restricted";
export type DatasetKind =
  | "legacy_unreviewed"
  | "synthetic_demo"
  | "reviewed_real";
export type ResourceKind = "textbook" | "score" | "diagram" | "activity";
export type Audience = "demo" | "public" | "admin";
export interface SourceRef {
  id: string;
  title: string;
  url: string | null;
  chapter: string | null;
  pageRange: string | null;
  originalFieldName?: string;
}
export interface RightsRecord {
  state: RightsState;
  holder: string | null;
  license: string | null;
  evidenceRef: string | null;
  allowView: boolean;
  allowPrint: boolean;
  allowDownload: boolean;
  allowRedistribute: boolean;
  checkedAt: string | null;
  checkedBy: string | null;
}
export interface Resource {
  id: string;
  title: string;
  description: string;
  instrument: Instrument;
  instrumentSystem: string;
  kind: ResourceKind;
  level: 1 | 2 | 3;
  objectives: string[];
  topics: string[];
  prerequisites: string[];
  estimatedMinutes: number;
  datasetKind: DatasetKind;
  currentDraftVersionId: string;
  publishedVersionId: string | null;
  publicationState: PublicationState;
  sourceRefs: SourceRef[];
  legacyEntryIds: string[];
  modulePlanIds: string[];
  revision: number;
  updatedAt?: string;
  demoShelf?: boolean;
}
export interface ResourceVersion {
  id: string;
  resourceId: string;
  version: string;
  reviewState: ReviewState;
  rights: RightsRecord;
  unitIds: string[];
  aiUsage: string;
  reviewScope: string | null;
  reviewerDisplayName: string | null;
  reviewerNameConsent: boolean;
  reviewedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  approvalEvidenceRef: string | null;
  basedOnVersionId: string | null;
  changeSummary: string;
  revision: number;
  createdAt: string;
}
export interface Block {
  id: string;
  type: "paragraph" | "image" | "score" | "audio";
  text?: string;
  src?: string;
  alt?: string;
  caption?: string;
}
export interface Unit {
  id: string;
  resourceVersionId: string;
  order: number;
  title: string;
  blocks: Block[];
  appLinkIds: string[];
}
export interface LegacyEntry {
  id: string;
  instrument: Instrument;
  level: 1 | 2 | 3;
  title: string;
  pageRange: string;
  questionCount: number;
  reviewState: "draft";
  rightsState: "unknown";
  approvedAt: null;
  body: null;
}
export interface AppLink {
  id: string;
  title: string;
  url: string;
  sourceDocumentUrl: string;
  instruments: Instrument[];
  instrumentSystem: string | null;
  scope: "mvp_candidate" | "common_tool" | "other" | "excluded_mismatch";
  purpose: string;
  level: number | null;
  status: "unchecked" | "available" | "broken" | "restricted";
  checkedAt: string | null;
  checkEvidence: string | null;
  contentAccuracyChecked: boolean;
  requiresCamera: "yes" | "no" | "unknown";
  requiresLogin: "yes" | "no" | "unknown";
  enabled: boolean;
  fallbackResourceId: string | null;
}
export interface ModulePlan {
  id: string;
  instrument: Instrument;
  slot: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  legacyEntryIds: string[];
  mappingState: "proposed" | "reviewed";
}
export interface ReviewIssue {
  id: string;
  resourceId: string;
  versionId: string;
  unitId: string | null;
  blockId: string | null;
  category: "music" | "pedagogy" | "safety" | "rights" | "other";
  severity: "critical" | "major" | "minor";
  description: string;
  evidence: string;
  suggestion: string;
  resolution: string | null;
  status: "open" | "fixed" | "verified" | "dismissed";
  dismissalReason: string | null;
}
export interface ReviewEvent {
  id: string;
  resourceId: string;
  versionId: string;
  from: ReviewState;
  to: ReviewState;
  actorId: string;
  role: string;
  reason: string;
  at: string;
  snapshotRevision: number;
  commandId?: string;
}
export interface LessonPlan {
  id: string;
  title: string;
  instrument: Instrument;
  targetLevel: 1 | 2 | 3;
  objectives: string[];
  durationMinutes: number;
  materials: string[];
  activities: Array<{
    id: string;
    phase: "intro" | "main" | "wrapup";
    title: string;
    minutes: number;
    teacherNotes: string;
    alternative: string;
    resources: Array<{ resourceId: string; versionId: string; unitId: string }>;
    appLinkIds: string[];
  }>;
  isDemo: boolean;
  updatedAt: string;
  revision: number;
}
export interface Bookmark {
  resourceId: string;
  versionId: string;
  unitId: string | null;
}
export interface ReadingPosition {
  resourceId: string;
  versionId: string;
  unitId: string;
  updatedAt: string;
}
export interface BookPresentation {
  resourceId: string;
  resourceVersionId: string;
  coverAssetId: string | null;
  coverOrigin: "provided" | "generated_typography" | "none";
  shelfOrder: number | null;
  displayTitle: string;
}
export interface ReadingAsset {
  id: string;
  resourceVersionId: string;
  format: "pdf" | "structured" | "pptx_source";
  fileRef: string | null;
  pageCount: number | null;
  checksum: string | null;
  availability: "missing" | "processing" | "available" | "failed" | "on_hold";
  rights: { allowView: boolean; allowPrint: boolean; allowDownload: boolean };
}
export interface BookPosition {
  projectId: "classical-library" | "gugak-library";
  resourceId: string;
  resourceVersionId: string;
  assetId: string;
  pageNumber: number | null;
  unitId: string | null;
  updatedAt: string;
}
export interface SearchQuery {
  q?: string;
  instruments?: Instrument[];
  kinds?: ResourceKind[];
  levels?: number[];
  objectives?: string[];
  topics?: string[];
  sort?: "title" | "recent";
}
export interface RepositoryData {
  resources: Resource[];
  versions: ResourceVersion[];
  units: Unit[];
  legacyEntries: LegacyEntry[];
  modulePlans: ModulePlan[];
  apps: AppLink[];
  plans: LessonPlan[];
  bookmarks: Bookmark[];
  positions: BookPosition[];
  bookPresentations: BookPresentation[];
  readingAssets: ReadingAsset[];
  issues: ReviewIssue[];
  reviewEvents: ReviewEvent[];
}
export interface RepositoryState extends RepositoryData {
  initialized: boolean;
  storageMode: "loading" | "local" | "memory";
  storageNotice: string | null;
  revision: number;
}
export interface ResourceDetail {
  resource: Resource;
  version: ResourceVersion;
  units: Unit[];
  assets: ReadingAsset[];
  presentation: BookPresentation | null;
}
export interface ReviewCommand {
  resourceId: string;
  versionId: string;
  to: ReviewState;
  actorId: string;
  role: string;
  reason: string;
  commandId?: string;
}
export type RepositoryErrorCode =
  | "not_found"
  | "validation_error"
  | "storage_unavailable"
  | "conflict"
  | "not_allowed";
export class RepositoryError extends Error {
  constructor(
    public code: RepositoryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
