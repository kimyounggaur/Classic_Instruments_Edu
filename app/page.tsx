import { Suspense } from "react";
import PrototypeApp from "@/components/prototype/PrototypeApp";
import RouteLoading from "@/components/prototype/RouteLoading";
export default function Page() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PrototypeApp />
    </Suspense>
  );
}
