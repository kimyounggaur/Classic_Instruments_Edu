import { InputError, MAX_BODY_BYTES } from './validation';

/** Compatibility helper: protected storage routes are disabled in mock-only mode. */
export async function signedInUser(): Promise<never> {
  throw new InputError('이 개발판은 실계정과 서버 저장을 사용하지 않습니다.', 405);
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export async function body(request: Request): Promise<unknown> {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new InputError('다른 사이트에서 전송된 요청입니다.', 403);
  if (!request.headers.get('content-type')?.includes('application/json')) throw new InputError('JSON 형식으로 요청해 주세요.', 415);
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) throw new InputError('요청 데이터가 너무 큽니다.', 413);
  if (!request.body) throw new InputError('요청 내용이 없습니다.');
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new InputError('요청 데이터가 너무 큽니다.', 413);
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(size);
  let position = 0;
  for (const chunk of chunks) {
    merged.set(chunk, position);
    position += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(merged));
  } catch {
    throw new InputError('JSON 형식이 올바르지 않습니다.');
  }
}

export function routeError(error: unknown) {
  if (error instanceof InputError) return json({ error: error.message }, error.status);
  return json({ error: '요청을 처리하지 못했습니다.' }, 503);
}
