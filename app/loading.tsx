export default function Loading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-white via-[#f5f8ff] to-[#edf3fb] pt-28 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        {/* Banner skeleton */}
        <div className="rounded-4xl bg-slate-200 h-64 md:h-96 w-full" />
        {/* Cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-3xl bg-slate-100 h-48" />
          ))}
        </div>
      </div>
    </div>
  );
}
