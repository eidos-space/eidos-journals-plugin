import { describe, expect, it } from "vitest"
import {
  calendarYearRange,
  indexDate,
  journalDateFromPath,
  summarizeJournals,
} from "./stats"

describe("journal statistics", () => {
  it("accepts journal dates across folder organizations and rejects invalid dates", () => {
    expect(journalDateFromPath("journals/2026/09/2026-09-23.md")).toBe(
      "2026-09-23"
    )
    expect(journalDateFromPath("journals/2026-09-23.md")).toBe("2026-09-23")
    expect(journalDateFromPath("journals/2026-02-30.md")).toBeNull()
    expect(journalDateFromPath("journals/notes.md")).toBeNull()
  })

  it("counts unique dates and keeps yesterday's streak active", () => {
    const stats = summarizeJournals(
      [
        "journals/2026/09/2026-09-20.md",
        "journals/2026/09/2026-09-21.md",
        "journals/2026/09/2026-09-22.md",
        "journals/2026-09-22.md",
        "journals/2025-12-31.md",
      ],
      new Date(2026, 8, 23)
    )
    expect(stats).toMatchObject({
      total: 4,
      thisYear: 3,
      currentStreak: 3,
      longestStreak: 3,
    })
  })

  it("aligns a past calendar year to whole weeks, including leap day", () => {
    const range = calendarYearRange(2024, new Date(2026, 8, 23))
    expect(indexDate(range.first).toISOString().slice(0, 10)).toBe("2024-01-01")
    expect(indexDate(range.last).toISOString().slice(0, 10)).toBe("2025-01-05")
    expect(indexDate(range.yearEnd).toISOString().slice(0, 10)).toBe(
      "2024-12-31"
    )
    expect(range.through - range.yearStart + 1).toBe(366)
  })

  it("shows the full current year but only counts entries through today", () => {
    const range = calendarYearRange(2026, new Date(2026, 8, 23))
    expect(indexDate(range.first).toISOString().slice(0, 10)).toBe("2025-12-29")
    expect(indexDate(range.last).toISOString().slice(0, 10)).toBe("2027-01-03")
    expect(indexDate(range.yearEnd).toISOString().slice(0, 10)).toBe(
      "2026-12-31"
    )
    expect(indexDate(range.through).toISOString().slice(0, 10)).toBe(
      "2026-09-23"
    )
  })
})
