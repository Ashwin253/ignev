export function ProductSkeleton() {
  return (
    <div className="group overflow-hidden rounded-3xl border-2 border-slate-300 bg-slate-50 shadow-[0_4px_16px_rgba(15,23,42,0.08)] flex flex-col animate-pulse">
      <div className="relative aspect-4/3 bg-slate-200" />
      <div className="grow p-4 flex flex-col gap-3 mt-1">
        <div className="h-2.5 w-16 bg-slate-200 rounded-full" />
        <div className="h-5 w-3/4 bg-slate-200 rounded-full" />
        <div className="flex gap-3 mt-1">
          <div className="h-3 w-14 bg-slate-200 rounded-full" />
          <div className="h-3 w-16 bg-slate-200 rounded-full" />
        </div>
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <div className="h-10 flex-1 bg-slate-200 rounded-2xl" />
        <div className="h-10 flex-1 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );
}
