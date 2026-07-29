export default function Loading() {
  return <div className="mx-auto max-w-7xl animate-pulse px-4 py-20 sm:px-6 lg:px-8" aria-live="polite"><span className="sr-only">Memuat halaman...</span><div className="h-10 w-2/3 rounded-lg bg-muted" /><div className="mt-5 h-5 w-1/2 rounded bg-muted" /><div className="mt-10 grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-36 rounded-xl bg-muted" />)}</div></div>;
}
