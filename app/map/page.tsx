import { Suspense } from 'react';
import FullMap from './FullMap';

export default function MapPage() {
  return (
    <div className="flex-grow pt-[80px] flex flex-col h-screen">
      <Suspense fallback={
        <div className="flex-grow flex items-center justify-center bg-slate-50 text-slate-400 font-medium">
          Loading Live Map...
        </div>
      }>
        <FullMap />
      </Suspense>
    </div>
  );
}
