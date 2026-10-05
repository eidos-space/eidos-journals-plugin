import { describe, expect, it, vi } from "vitest"
import type { CommonCapabilities } from "@eidos.space/plugin-sdk"
import { openTodayJournal } from "./journal"
import manifest from "../plugin.json"

it("grants the overview permission to create today's journal", () => {
  expect(manifest.views.find(view => view.id === "overview")?.access).toBe("write")
  expect(manifest.workspace.files).toBe(true)
})

function fixture(existing = false) {
  const fs = {
    stat: vi.fn(async () => existing ? { path: "", name: "", extension: ".md", size: 10, isDirectory: false } : null),
    writeText: vi.fn(async () => {}),
    readText: vi.fn(async () => "Keep this journal"),
    readBinary: vi.fn(async () => new Uint8Array()),
    writeBinary: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
    rename: vi.fn(async () => {}),
    list: vi.fn(async () => []),
    watch: vi.fn(async () => ({ dispose() {} })),
  }
  const openFile = vi.fn(async () => {})
  const capabilities = {
    fs,
    settings: { get: vi.fn(async (key: string) => key === "folder" ? "notes" : "YYYY/MM/YYYY-MM-DD.md") },
    ui: { openFile, notify: vi.fn() },
  } satisfies CommonCapabilities
  return { capabilities, fs, openFile }
}

describe("open today's journal", () => {
  const date = new Date(2026, 9, 4, 23, 59)
  it("creates a missing journal using settings and local date, then opens it", async () => {
    const { capabilities, fs, openFile } = fixture()
    await openTodayJournal(capabilities, new AbortController().signal, date)
    expect(fs.writeText).toHaveBeenCalledWith("notes/2026/10/2026-10-04.md", "")
    expect(openFile).toHaveBeenCalledWith("notes/2026/10/2026-10-04.md")
    expect(fs.writeText.mock.invocationCallOrder[0]).toBeLessThan(openFile.mock.invocationCallOrder[0]!)
  })
  it("opens existing content without writing", async () => {
    const { capabilities, fs, openFile } = fixture(true)
    await openTodayJournal(capabilities, new AbortController().signal, date)
    expect(fs.writeText).not.toHaveBeenCalled()
    expect(openFile).toHaveBeenCalledOnce()
  })
  it("does not navigate after a failed write", async () => {
    const { capabilities, fs, openFile } = fixture()
    fs.writeText.mockRejectedValueOnce(new Error("Disk full"))
    await expect(openTodayJournal(capabilities, new AbortController().signal, date)).rejects.toThrow("Disk full")
    expect(openFile).not.toHaveBeenCalled()
  })
  it("does not create or navigate after disposal during stat", async () => {
    const { capabilities, fs, openFile } = fixture()
    const controller = new AbortController()
    fs.stat.mockImplementationOnce(async () => { controller.abort(); return null })
    await expect(openTodayJournal(capabilities, controller.signal, date)).rejects.toThrow()
    expect(fs.writeText).not.toHaveBeenCalled()
    expect(openFile).not.toHaveBeenCalled()
  })
})
