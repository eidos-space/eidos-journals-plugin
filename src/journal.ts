import type { CommonCapabilities } from "@eidos.space/plugin-sdk"

export async function openTodayJournal(
  { fs, settings, ui }: CommonCapabilities,
  signal: AbortSignal,
  date = new Date()
): Promise<void> {
  if (!fs || !settings || !ui.openFile) throw new Error("File access unavailable")
  const folder = await settings.get("folder")
  const organization = await settings.get("organization")
  if (typeof folder !== "string" || typeof organization !== "string")
    throw new Error("Invalid Journals settings")
  const path = journalPath(date, folder, organization as Organization)
  signal.throwIfAborted()
  const existing = await fs.stat(path)
  signal.throwIfAborted()
  if (existing?.isDirectory) throw new Error("The journal path is a folder")
  if (!existing) await fs.writeText(path, "")
  signal.throwIfAborted()
  await ui.openFile(path)
}

export type Organization =
  | "YYYY-MM-DD.md"
  | "YYYY/YYYY-MM-DD.md"
  | "YYYY/MM/YYYY-MM-DD.md"

export function journalPath(
  date: Date,
  folder: string,
  organization: Organization
): string {
  if (Number.isNaN(date.getTime())) throw new Error("Invalid journal date")
  const root = folder.trim().replace(/\/$/, "")
  if (
    root &&
    (root.startsWith("/") ||
      root
        .split("/")
        .some(
          (part) =>
            !part ||
            part === "." ||
            part === ".." ||
            part.toLowerCase() === ".graft" ||
            /[<>:"\\|?*\u0000-\u001f]/.test(part)
        ))
  )
    throw new Error("Journals folder must be a safe Space-relative path")
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const group =
    organization === "YYYY/MM/YYYY-MM-DD.md"
      ? `${year}/${month}`
      : organization === "YYYY/YYYY-MM-DD.md"
        ? year
        : organization === "YYYY-MM-DD.md"
          ? ""
          : (() => {
              throw new Error("Invalid organization style")
            })()
  return [root, group, `${year}-${month}-${day}.md`].filter(Boolean).join("/")
}
