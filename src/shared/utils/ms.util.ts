type TimeUnit = 'ms' | 's' | 'm' | 'h' | 'd';

const TIME_MAP: Record<TimeUnit, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/**
 * Converts time string to milliseconds
 *
 * example
 * ms('500ms') -> 500
 * ms('10s')   -> 10000
 * ms('5m')    -> 300000
 * ms('2h')    -> 7200000
 * ms('1d')    -> 86400000
 * ms(1500)    -> 1500
 */
export function ms(value: string | number): number {
  if (typeof value === 'number') {
    return value;
  }

  const match = value.trim().match(/^(\d+)(ms|s|m|h|d)$/);

  if (!match) {
    throw new Error(`Invalid time format: "${value}"`);
  }

  const [, amount, unit] = match;

  return Number(amount) * TIME_MAP[unit as TimeUnit];
}
