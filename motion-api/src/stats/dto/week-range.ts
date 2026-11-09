// "This week" must be computed in the USER's timezone, not the server's:
// a run at 23:30 Sunday in Algiers is still Sunday there, even if it is
// already Monday in UTC. No date library needed, only Intl.

type Parts = { y: number; m: number; d: number; h: number; mi: number; s: number };

// What the wall clock reads in `timeZone` at the instant `date`
function zonedParts(date: Date, timeZone: string): Parts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23', // hours 0-23 (never "24")
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });
  const p: Record<string, number> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== 'literal') p[part.type] = Number(part.value);
  }
  return { y: p.year, m: p.month, d: p.day, h: p.hour, mi: p.minute, s: p.second };
}

// offset = (wall clock read as if it were UTC) - (the real UTC instant)
function offsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const wallAsUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  return wallAsUtc - Math.floor(date.getTime() / 1000) * 1000;
}

// The real UTC instant at which the wall clock in `timeZone` reads 00:00 on y-m-d
function startOfLocalDay(y: number, m: number, d: number, timeZone: string): Date {
  const wall = Date.UTC(y, m - 1, d);
  let guess = wall - offsetMs(new Date(wall), timeZone);
  guess = wall - offsetMs(new Date(guess), timeZone); // refine around DST changes
  return new Date(guess);
}

export type WeekRange = { start: Date; end: Date }; // start inclusive, end EXCLUSIVE

export function weekRange(
  now: Date,
  timeZone: string,
  opts: { weeksAgo?: number; weekStartsOn?: number } = {},
): WeekRange {
  const { weeksAgo = 0, weekStartsOn = 0 } = opts; // 0 = Sunday

  const p = zonedParts(now, timeZone);
  // The user's local calendar date, held as a UTC date for easy day arithmetic
  const today = new Date(Date.UTC(p.y, p.m - 1, p.d));
  const daysSinceStart = (today.getUTCDay() - weekStartsOn + 7) % 7;

  const first = new Date(today);
  first.setUTCDate(today.getUTCDate() - daysSinceStart - 7 * weeksAgo);
  const next = new Date(first);
  next.setUTCDate(first.getUTCDate() + 7);

  return {
    start: startOfLocalDay(first.getUTCFullYear(), first.getUTCMonth() + 1, first.getUTCDate(), timeZone),
    end: startOfLocalDay(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), timeZone),
  };
}