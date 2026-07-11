const DURATION_PATTERN = /^(\d+)(s|m|h|d)$/;

export function durationToDate(duration: string): Date {
  const match = DURATION_PATTERN.exec(duration.trim());

  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }

  const [, amountValue, unit] = match;

  if (!amountValue || !unit) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }

  const amount = Number(amountValue);
  const multiplier = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }[unit as 's' | 'm' | 'h' | 'd'];

  return new Date(Date.now() + amount * multiplier);
}
