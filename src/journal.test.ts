import { describe, expect, it } from "vitest"
import { journalPath } from "./journal"

describe("journalPath", () => {
  const date = new Date(2026, 8, 23, 23, 59)
  it("uses the local date and selected organization", () => {
    expect(journalPath(date, "journals", "YYYY-MM-DD.md")).toBe(
      "journals/2026-09-23.md"
    )
    expect(journalPath(date, "journals", "YYYY/YYYY-MM-DD.md")).toBe(
      "journals/2026/2026-09-23.md"
    )
    expect(journalPath(date, "journals", "YYYY/MM/YYYY-MM-DD.md")).toBe(
      "journals/2026/09/2026-09-23.md"
    )
    expect(journalPath(date, "", "YYYY-MM-DD.md")).toBe("2026-09-23.md")
  })
  it("rejects paths outside the Space or into implementation data", () => {
    for (const folder of [
      "../notes",
      "/tmp",
      "notes//daily",
      ".graft",
      "notes\\outside",
    ])
      expect(() => journalPath(date, folder, "YYYY-MM-DD.md")).toThrow()
  })
})
