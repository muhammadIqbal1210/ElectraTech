export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b132b]" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
      <span className="sr-only">Memuat…</span>
    </div>
  );
}
