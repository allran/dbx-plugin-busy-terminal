export const SPEED_MIN = 0.4;
export const SPEED_MAX = 4;

const BASE_INTERVAL_MS = 280;
const MIN_INTERVAL_MS = 40;

/**
 * Delay before the next fake log line.
 * Random mode samples a speed factor log-uniformly across the slider range,
 * so slow and fast lines are equally likely.
 * @param {number} speed
 * @param {boolean} random
 */
export function lineDelayMs(speed, random) {
  const factor = random ? randomSpeedFactor() : Number(speed) || 1;
  return Math.max(MIN_INTERVAL_MS, Math.round(BASE_INTERVAL_MS / factor));
}

function randomSpeedFactor() {
  const lo = Math.log(SPEED_MIN);
  const hi = Math.log(SPEED_MAX);
  return Math.exp(lo + Math.random() * (hi - lo));
}
