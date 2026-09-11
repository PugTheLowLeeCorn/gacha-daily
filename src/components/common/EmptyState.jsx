import Button from './Button'

export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {description ? <p className="mt-2 text-zinc-500 dark:text-zinc-400">{description}</p> : null}
      {actionLabel ? (
        <div className="mt-5">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  )
}
