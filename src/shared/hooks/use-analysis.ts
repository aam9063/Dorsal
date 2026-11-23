import { useEffect, useRef, useState } from 'react'
import {
  startAnalysis,
  type AnalyzeFailure,
  type AnalyzeOutcome,
  type AnalyzeProgress,
} from '../../worker/client'

export interface AnalysisState {
  status: 'running' | 'ok' | 'cancelled' | 'error'
  progress: AnalyzeProgress | null
  failure: AnalyzeFailure | null
}

/**
 * Runs the analysis of one `File` on the worker for as long as the caller
 * stays mounted: unmounting cancels the run between chunks. When the run
 * finishes, `onFinished` is called once with the outcome so the screen can
 * hand the result on.
 */
export function useAnalysis(
  file: File,
  onFinished: (outcome: AnalyzeOutcome) => void,
): AnalysisState {
  const [progress, setProgress] = useState<AnalyzeProgress | null>(null)
  const [outcome, setOutcome] = useState<AnalyzeOutcome | null>(null)
  const onFinishedRef = useRef(onFinished)

  useEffect(() => {
    onFinishedRef.current = onFinished
  })

  useEffect(() => {
    let live = true
    const run = startAnalysis(file, (tick) => {
      if (live) {
        setProgress(tick)
      }
    })
    void run.outcome.then((result) => {
      if (!live) {
        return
      }
      setOutcome(result)
      onFinishedRef.current(result)
    })
    return () => {
      live = false
      run.cancel()
    }
  }, [file])

  return {
    status: outcome === null ? 'running' : outcome.status,
    progress,
    failure: outcome !== null && outcome.status === 'error' ? outcome.failure : null,
  }
}
