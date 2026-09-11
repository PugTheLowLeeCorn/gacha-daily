import Button from './Button'

export default function ErrorState({ title = 'Something went wrong.', message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-400/40 bg-rose-50 px-6 py-8 text-center dark:bg-rose-950/30">
      <h2 className="font-display text-lg font-semibold text-rose-700 dark:text-rose-200">{title}</h2>
      {message ? <p className="mt-2 text-sm text-rose-700/80 dark:text-rose-200/80">{message}</p> : null}
      {onRetry ? (
        <div className="mt-4">
          <Button onClick={onRetry}>Try again</Button>
        </div>
      ) : null}
    </div>
  )
}
