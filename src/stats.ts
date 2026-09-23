const DAY_MS = 86_400_000

export interface JournalStats {
  dates: string[]
  total: number
  thisYear: number
  currentStreak: number
  longestStreak: number
}

export function localDateKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function dateIndex(key: string): number {
  const [year, month, day] = key.split("-").map(Number)
  return Date.UTC(year!, month! - 1, day) / DAY_MS
}

export function indexDate(index: number): Date {
  return new Date(index * DAY_MS)
}

export function calendarYearRange(
  year: number,
  today: Date
): {
  first: number
  last: number
  through: number
  yearStart: number
  yearEnd: number
} {
  const yearStart = dateIndex(`${year}-01-01`)
  const yearEnd = dateIndex(`${year}-12-31`)
  const through =
    year === today.getFullYear() ? dateIndex(localDateKey(today)) : yearEnd
  const mondayOffset = (indexDate(yearStart).getUTCDay() + 6) % 7
  const sundayOffset = 6 - ((indexDate(yearEnd).getUTCDay() + 6) % 7)
  return {
    first: yearStart - mondayOffset,
    last: yearEnd + sundayOffset,
    through,
    yearStart,
    yearEnd,
  }
}

export function journalDateFromPath(path: string): string | null {
  const match = /(?:^|\/)(\d{4})-(\d{2})-(\d{2})\.md$/i.exec(path)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return null
  return `${match[1]}-${match[2]}-${match[3]}`
}

export function summarizeJournals(paths: string[], today: Date): JournalStats {
  const dates = [
    ...new Set(paths.map(journalDateFromPath).filter((date) => date !== null)),
  ].sort()
  const days = new Set(dates.map(dateIndex))
  const current = dateIndex(localDateKey(today))
  const streakEnd = days.has(current) ? current : current - 1
  let currentStreak = 0
  for (let day = streakEnd; days.has(day); day--) currentStreak++
  let longestStreak = 0
  let run = 0
  let previous = Number.NEGATIVE_INFINITY
  for (const day of [...days].sort((left, right) => left - right)) {
    run = day === previous + 1 ? run + 1 : 1
    longestStreak = Math.max(longestStreak, run)
    previous = day
  }
  return {
    dates,
    total: dates.length,
    thisYear: dates.filter((date) => date.startsWith(`${today.getFullYear()}-`))
      .length,
    currentStreak,
    longestStreak,
  }
}
