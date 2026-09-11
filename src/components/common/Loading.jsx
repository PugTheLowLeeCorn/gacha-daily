export default function Loading({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-zinc-500" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      <span>{label}</span>
    </div>
  )
}
