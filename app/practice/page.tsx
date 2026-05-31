import { Suspense } from "react";
import PracticeClient from "./PracticeClient";
import { Spinner } from "@/components/ui/Spinner";

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      }
    >
      <PracticeClient />
    </Suspense>
  );
}
