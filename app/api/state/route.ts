export const dynamic = 'force-static';

const emptyMockState = () => ({
  progress: {},
  bookmarks: {},
  favorites: [],
  registry: [],
  videos: [],
  reviews: [],
  questions: [],
  reports: [],
});

/** State is deliberately kept in React memory for this mock-only build. */
export async function GET() {
  return Response.json({
    mode: 'mock-only',
    accountKey: null,
    revision: 0,
    updatedAt: null,
    state: emptyMockState(),
    message: '이 개발판은 서버에 학습·검수·학생 정보를 저장하지 않습니다.',
  }, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export async function PUT() {
  return Response.json({
    error: '이 개발판에서는 서버 저장을 사용하지 않습니다.',
    mode: 'mock-only',
  }, { status: 405, headers: { 'Allow': 'GET', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
