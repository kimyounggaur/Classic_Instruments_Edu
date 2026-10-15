"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main style={{ padding: "3rem" }}>
      <h1>화면을 불러오지 못했습니다</h1>
      <p>저장된 자료를 유지한 채 다시 시도할 수 있습니다.</p>
      <button onClick={reset}>다시 시도</button>
    </main>
  );
}
