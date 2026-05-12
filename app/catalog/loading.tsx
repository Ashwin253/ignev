export default function CatalogLoading() {
  return (
    <section className="bg-white py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-full mb-10" />
        <div className="h-32 bg-slate-100 rounded-3xl mb-6" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-3xl bg-slate-100 h-72" />
          ))}
        </div>
      </div>
    </section>
  );
}
