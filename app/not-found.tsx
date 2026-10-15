import Link from "next/link";
export default function NotFound() {
  return (
    <main style={{ padding: "3rem" }}>
      <h1>자료를 찾을 수 없습니다</h1>
      <Link href="/">책장으로 돌아가기</Link>
    </main>
  );
}
