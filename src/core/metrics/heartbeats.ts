import type { Activity } from '../model'

/** Highest maximum heart rate of the season, with the local date it happened. */
export interface HeartbeatPeak {
  /** Beats per minute. */
  bpm: number
  /** `1` (January) to `12` (December). */
  month: number
  /** Day of month, `1` to `31`. */
  day: number
}

/** Full result of story 07 "El año en latidos". */
export interface Heartbeats {
  /**
   * Sum over activities with an average heart rate of
   * `avgHeartRate * movingTimeS / 60` beats.
   */
  beats: number
  /** Equivalent resting days at 60 bpm: `beats / (60 * 1440)`. */
  restingDays: number
  /**
   * Activity with the highest `maxHeartRate`, with its date, whether or not it
   * also carries an average: the peak is the highest heart rate recorded in the
   * season, and BRIEF §6 scopes only the beat sum to activities with an average.
   * `null` when no activity carries a maximum.
   */
  peak: HeartbeatPeak | null
  /** Moving time with heart rate divided by total moving time. */
  coverage: number
}

/**
 * Heart-beat totals for story 07. Returns `null` when the share of moving
 * time with an average heart rate is below `0.30` of the season total.
 */
export function heartbeats(activities: readonly Activity[]): Heartbeats | null {
  let beats = 0
  let movingTimeWithHeartRateS = 0
  let totalMovingTimeS = 0
  let peak: HeartbeatPeak | null = null

  for (const activity of activities) {
    totalMovingTimeS += activity.movingTimeS
    if (activity.maxHeartRate !== null && (peak === null || activity.maxHeartRate > peak.bpm)) {
      peak = {
        bpm: activity.maxHeartRate,
        month: activity.startLocal.month,
        day: activity.startLocal.day,
      }
    }
    if (activity.avgHeartRate === null) {
      continue
    }
    movingTimeWithHeartRateS += activity.movingTimeS
    beats += activity.avgHeartRate * (activity.movingTimeS / 60)
  }

  if (totalMovingTimeS === 0 || movingTimeWithHeartRateS * 10 < totalMovingTimeS * 3) {
    return null
  }

  return {
    beats,
    restingDays: beats / (60 * 1440),
    peak,
    coverage: movingTimeWithHeartRateS / totalMovingTimeS,
  }
}
