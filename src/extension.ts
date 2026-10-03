import type { ExtensionContext } from "@eidos.space/plugin-sdk"
import { openTodayJournal } from "./journal"

export default function activate(ctx: ExtensionContext) {
  ctx.capabilities.actions.register("overview", async ({ capabilities: { ui } }) => {
    if (!ui.navigate) throw new Error("Page navigation unavailable")
    await ui.navigate("overview")
  })
  ctx.capabilities.actions.register("today", async ({ capabilities, signal }) => {
    await openTodayJournal(capabilities, signal)
  })
}
