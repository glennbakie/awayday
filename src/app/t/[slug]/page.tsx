export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from "react";
import RunSheetClient from "./run-sheet-client";

export default function RunSheetPage() {
  return (
    <Suspense 
      fallback={
        <div 
          style={{ backgroundColor: '#090D16', color: '#F8FAFC', minHeight: '100vh' }} 
          className="w-full flex items-center justify-center text-xs font-bold"
        >
          Loading AwayDay Run-Sheet...
        </div>
      }
    >
      <RunSheetClient />
    </Suspense>
  );
}
