/**
 * useLiveFeed — simulates the near-real-time status feed.
 *
 * Devices push stateless status; this hook advances the seeded simulation on
 * an interval and exposes the current fleet. The interval is always cleared
 * on unmount (and when paused). Read-only by construction: the only control
 * is pausing the local simulation clock — nothing here writes to or commands
 * a device.
 */

import { useEffect, useRef, useState } from 'react'
import {
  advanceFleet,
  FLEET_SEED,
  fleetEndTime,
  generateFleet,
  LIVE_STEP_SEC,
} from './fleet'
import { mulberry32, type Rng } from './prng'
import type { Device } from './types'

export interface LiveFeedState {
  /** Current fleet with up-to-date history. */
  fleet: Device[]
  /** Timestamp (epoch ms) of the simulated feed's "now". Use this as `now`
   * when deriving statuses, so fresh devices are not mistaken for offline. */
  lastUpdated: number
  /** Whether the feed is currently paused. */
  paused: boolean
  /** Pause/resume the local simulation clock. */
  setPaused: (paused: boolean) => void
}

interface SimClock {
  now: number
  rng: Rng
}

export function useLiveFeed(tickMs: number = 2000, seed: number = FLEET_SEED): LiveFeedState {
  const [fleet, setFleet] = useState<Device[]>(() => generateFleet(seed))
  const [lastUpdated, setLastUpdated] = useState<number>(() => fleetEndTime(fleet))
  const [paused, setPaused] = useState(false)
  const clockRef = useRef<SimClock | null>(null)

  useEffect(() => {
    if (paused) return undefined
    if (clockRef.current === null) {
      clockRef.current = {
        now: fleetEndTime(fleet),
        rng: mulberry32(seed ^ 0x9e3779b9),
      }
    }
    const clock = clockRef.current
    const id = window.setInterval(() => {
      clock.now += LIVE_STEP_SEC * 1000
      setFleet((prev) => advanceFleet(prev, clock.rng, clock.now))
      setLastUpdated(clock.now)
    }, tickMs)
    return () => window.clearInterval(id)
    // `fleet` is intentionally not a dependency: the clock starts from the
    // initial fleet once, then advanceFleet works off previous state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, tickMs, seed])

  return { fleet, lastUpdated, paused, setPaused }
}
