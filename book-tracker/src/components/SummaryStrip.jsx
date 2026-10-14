import { MSG } from '../utils/constants.js'
import { describeCounts } from '../state/selectors.js'

/**
 * One-line shelf summary plus a progress bar of finished / total.
 *
 * @param {Object} props
 * @param {{total:number,toRead:number,reading:number,finished:number,percentFinished:number}} [props.counts]
 */
export default function SummaryStrip({
  counts = { total: 0, toRead: 0, reading: 0, finished: 0, percentFinished: 0 },
}) {
  const summaryText = describeCounts(counts)
  const totalLabel =
    counts.total === 0
      ? MSG.noBooksYet
      : `${counts.total} ${counts.total === 1 ? 'book' : 'books'}`

  return (
    <section className="summary" aria-label="Shelf summary">
      <p className="summary__text">
        <span className="summary__total">{totalLabel}</span>
        {summaryText ? <span className="summary__parts"> · {summaryText}</span> : null}
      </p>

      <div
        className="summary__progress"
        role="progressbar"
        aria-label="Books finished"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={counts.percentFinished}
        aria-valuetext={`${counts.finished} of ${counts.total} finished`}
      >
        <span
          className="summary__progress-bar"
          style={{ width: `${counts.percentFinished}%` }}
        />
      </div>
    </section>
  )
}
