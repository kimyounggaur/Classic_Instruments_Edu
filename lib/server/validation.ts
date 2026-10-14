/** Pure validation shared by routes and deterministic tests. */
export class InputError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export type Progress = { chapterId: string; page: number; percent: number; updatedAt: string; completedChapters?: string[] };
export type RegistryEntry = { id: string; name: string; instrument: string; category: string; appType: string; url: string; description: string };
export type VideoEntry = { id: string; instrument: string; topic: string; front: string; side: string; pov: string; title: string };
export type ReviewEntry = { id: string; instrument: string; chapterId?: string; note: string; reviewer?: string; status: "draft" | "pending" | "needs_changes"; createdAt: string; updatedAt?: string };
export type QuestionEntry = { id: string; instrument: string; text: string; createdAt: string };
export type ReportEntry = { id: string; instrument: string; minutes: number; note: string; createdAt: string };
export type WorkspaceState = {
  progress: Record<string, Progress>;
  bookmarks: Record<string, number[]>;
  favorites: string[];
  registry: RegistryEntry[];
  videos: VideoEntry[];
  reviews: ReviewEntry[];
  questions: QuestionEntry[];
  reports: ReportEntry[];
};
export const MAX_BODY_BYTES = 350_000;
export function emptyState(): WorkspaceState { return { progress: {}, bookmarks: {}, favorites: [], registry: [], videos: [], reviews: [], questions: [], reports: [] }; }
export function object(value: unknown, label = "요청"): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError(`${label} 형식이 올바르지 않습니다.`);
  return value as Record<string, unknown>;
}
export function string(value: unknown, label: string, max = 200, required = true): string {
  if (typeof value !== "string" || value.length > max || (required && !value.trim())) throw new InputError(`${label}을(를) 확인해 주세요. (최대 ${max}자)`);
  return value.trim();
}
export function number(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new InputError(`${label} 범위는 ${min}~${max}입니다.`);
  return value;
}
export function id(value: unknown, label = "식별자"): string {
  const result = string(value, label, 100);
  if (!/^[\p{L}\p{N}_:.-]+$/u.test(result) || ["__proto__", "constructor", "prototype"].includes(result)) throw new InputError(`${label} 형식이 올바르지 않습니다.`);
  return result;
}
export function safeHttps(value: unknown, label = "주소", allowEmpty = false): string {
  const raw = string(value, label, 2200, !allowEmpty);
  if (!raw && allowEmpty) return "";
  let url: URL;
  try { url = new URL(raw); } catch { throw new InputError(`${label}에 올바른 HTTPS 주소를 입력해 주세요.`); }
  // No requests are proxied. Reject credentials and local endpoints as an additional safeguard.
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || /^127\.|^10\.|^192\.168\.|^169\.254\.|^0\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host.startsWith("[")) throw new InputError(`${label}에는 외부 HTTPS 주소만 등록할 수 있습니다.`);
  return url.href;
}
function timestamp(value: unknown, label = "날짜"): string {
  const raw = string(value, label, 40);
  if (!Number.isFinite(Date.parse(raw))) throw new InputError(`${label} 형식이 올바르지 않습니다.`);
  return raw;
}
function list(value: unknown, label: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new InputError(`${label}은(는) 최대 ${max}개까지 저장할 수 있습니다.`);
  return value;
}
function uniqueEntries<T extends {id: string}>(items: T[]): T[] {
  if (new Set(items.map(v => v.id)).size !== items.length) throw new InputError("중복된 항목 ID가 있습니다.");
  return items;
}
function optionalString(o: Record<string, unknown>, key: string, max = 200) { return o[key] === undefined ? undefined : string(o[key], key, max, false); }
export function validateStatePatch(value: unknown): Partial<WorkspaceState> {
  const source = object(value, "저장 데이터");
  const allowed = Object.keys(emptyState());
  if (Object.keys(source).some(key => !allowed.includes(key))) throw new InputError("지원하지 않는 저장 항목입니다.");
  const out: Partial<WorkspaceState> = {};
  if (source.progress !== undefined) {
    const entries = Object.entries(object(source.progress, "학습 진도"));
    if (entries.length > 200) throw new InputError("학습 진도는 최대 200권까지 저장할 수 있습니다.");
    out.progress = Object.fromEntries(entries.map(([key,value]) => {
      id(key); const p = object(value, "학습 진도");
      const chapterId = string(p.chapterId, "단원", 100, false);
      const page = number(p.page, "쪽수", 1, 10000); if (!Number.isInteger(page)) throw new InputError("쪽수는 정수여야 합니다.");
      const item: Progress = { chapterId, page, percent: number(p.percent, "진도", 0, 100), updatedAt: timestamp(p.updatedAt) };
      if (p.completedChapters !== undefined) item.completedChapters = list(p.completedChapters,"완료 단원",500).map(v=>id(v));
      return [key, item];
    }));
  }
  if (source.bookmarks !== undefined) {
    const entries = Object.entries(object(source.bookmarks, "책갈피"));
    if (entries.length > 200) throw new InputError("책갈피는 최대 200권까지 저장할 수 있습니다.");
    out.bookmarks = Object.fromEntries(entries.map(([key,value]) => { id(key); return [key, [...new Set(list(value, "책갈피", 200).map(v => { const n=number(v,"책갈피 쪽수",1,10000); if (!Number.isInteger(n)) throw new InputError("쪽수는 정수여야 합니다."); return n; }))]]; }));
  }
  if (source.favorites !== undefined) out.favorites = [...new Set(list(source.favorites,"즐겨찾기",200).map(v=>id(v)))];
  if (source.registry !== undefined) out.registry = uniqueEntries(list(source.registry,"웹앱",200).map(value=>{const o=object(value);return { id:id(o.id),name:string(o.name,"앱 이름",100),instrument:string(o.instrument,"악기",100),category:string(o.category,"카테고리",100),appType:string(o.appType,"앱 종류",100),url:safeHttps(o.url),description:string(o.description,"설명",1000,false) };}));
  if (source.videos !== undefined) out.videos = uniqueEntries(list(source.videos,"영상",300).map(value=>{const o=object(value);return { id:id(o.id),instrument:string(o.instrument,"악기",100),topic:string(o.topic,"주제",100),title:string(o.title,"영상 제목",200),front:safeHttps(o.front??"","정면 영상",true),side:safeHttps(o.side??"","측면 영상",true),pov:safeHttps(o.pov??"","POV 영상",true) };}));
  if (source.reviews !== undefined) out.reviews = uniqueEntries(list(source.reviews,"검수 요청",500).map(value=>{
    const o=object(value); const status = string(o.status,"검수 상태",30);
    if (!["draft","pending","needs_changes"].includes(status)) throw new InputError("공식 전문가 감수는 인증 증빙을 확인한 뒤 별도 게시 절차로 반영합니다.");
    return { id:id(o.id),instrument:string(o.instrument,"악기",100),chapterId:optionalString(o,"chapterId",100),note:string(o.note,"검수 내용",5000,false),reviewer:optionalString(o,"reviewer",120),status:status as ReviewEntry["status"],createdAt:timestamp(o.createdAt),updatedAt:o.updatedAt===undefined?undefined:timestamp(o.updatedAt) };
  }));
  if (source.questions !== undefined) out.questions = uniqueEntries(list(source.questions,"질문 기록",500).map(value=>{const o=object(value);return {id:id(o.id),instrument:string(o.instrument,"악기",100),text:string(o.text,"질문",3000),createdAt:timestamp(o.createdAt)};}));
  if (source.reports !== undefined) out.reports = uniqueEntries(list(source.reports,"연습 기록",1000).map(value=>{const o=object(value);return {id:id(o.id),instrument:string(o.instrument,"악기",100),minutes:number(o.minutes,"연습 시간",0,1440),note:string(o.note,"연습 메모",3000,false),createdAt:timestamp(o.createdAt)};}));
  return out;
}
export type Mission = {title: string; bookId?: string; chapterId?: string; targetMinutes: number};
export function validateMission(value: unknown): Mission {
  const o=object(value,"미션");
  return { title:string(o.title,"미션 제목",300), bookId:o.bookId===undefined?undefined:id(o.bookId),chapterId:optionalString(o,"chapterId",100),targetMinutes:number(o.targetMinutes??10,"목표 시간",1,180) };
}
export function canManageClassroom(ownerId: string, userId: string): boolean { return Boolean(ownerId && userId && ownerId===userId); }
export function hasClassroomAccess(ownerId: string, userId: string, memberIds: string[]): boolean { return canManageClassroom(ownerId,userId)||Boolean(userId && memberIds.includes(userId)); }
