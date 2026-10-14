export const dynamic = 'force-static';

/** Classroom screens use component-local synthetic cards only. */
export async function GET() {
  return Response.json({
    mode: 'mock-only',
    sessions: [],
    message: '실계정, 참여 코드, 학생 명단, 서버 저장을 사용하지 않는 합성 수업 시연입니다.',
  }, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export async function POST() {
  return Response.json({
    error: '이 개발판에서는 수업 생성·참여·제출을 서버에 저장하지 않습니다.',
    mode: 'mock-only',
  }, { status: 405, headers: { 'Allow': 'GET', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
