export const dynamic = 'force-static';

/** This development build intentionally has no account or profile surface. */
export async function GET() {
  return Response.json({
    mode: 'mock-only',
    authenticated: false,
    accountKey: null,
    user: null,
    message: '합성 승인 시연은 실계정을 사용하지 않습니다.',
  }, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
