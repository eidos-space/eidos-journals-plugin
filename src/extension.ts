import type { ExtensionContext } from "@eidos.space/plugin-sdk"
import { journalPath, type Organization } from "./journal"

export default function activate(ctx: ExtensionContext) {
  ctx.capabilities.actions.register("overview", async ({ capabilities: { ui } }) => {
    if (!ui.navigate) throw new Error("Page navigation unavailable")
    await ui.navigate("overview")
  })
  ctx.capabilities.actions.register("today", async ({ capabilities: { settings, ui, fs } }) => {
    if (!fs || !ui.openFile) throw new Error("File access unavailable")
    const folder = await settings.get("folder")
    const organization = await settings.get("organization")
    if (typeof folder !== "string" || typeof organization !== "string")
      throw new Error("Invalid Journals settings")
    const path = journalPath(new Date(), folder, organization as Organization)
    const existing = await fs.stat(path)
    if (!existing) {
      await fs.writeText(path, "")
    }
    await ui.openFile(path)
  })
}
