import { Suspense } from "react";
import { notFound } from "next/navigation";
import PrototypeApp from "@/components/prototype/PrototypeApp";
import RouteLoading from "@/components/prototype/RouteLoading";
import { createSeed } from "@/lib/prototype/seed";
export default async function Page({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const valid =
    (path[0] === "library" &&
      (path.length === 1 ||
        path.length === 2 ||
        (path.length === 4 && path[2] === "units"))) ||
    (path.length === 1 && ["practice", "bookmarks"].includes(path[0])) ||
    (path[0] === "teacher" &&
      path[1] === "plans" &&
      [2, 3].includes(path.length)) ||
    (path[0] === "admin" &&
      ((path.length === 2 &&
        ["resources", "apps", "issues", "mapping"].includes(path[1])) ||
        (path[1] === "reviews" && path.length === 3)));
  if (!valid) notFound();
  if (
    path[0] === "library" &&
    path.length > 1 &&
    !createSeed().resources.some((resource) => resource.id === path[1])
  )
    notFound();
  return (
    <Suspense fallback={<RouteLoading />}>
      <PrototypeApp />
    </Suspense>
  );
}
