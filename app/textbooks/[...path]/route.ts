export function GET() {
  return new Response(
    "권리가 확인되지 않은 교재 파일은 공개 경로에서 제공하지 않습니다.",
    {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      },
    },
  );
}
