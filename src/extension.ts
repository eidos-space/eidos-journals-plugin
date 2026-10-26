import type { ExtensionContext } from "@eidos.space/plugin-sdk"
import { openTodayJournal } from "./journal"
import { localizeError } from "./errors"

export default function activate(ctx: ExtensionContext) {
  ctx.capabilities.actions.register("overview", async ({ capabilities: { ui } }) => {
    if (!ui.navigate) throw new Error(ctx.i18n.t("error.navigation"))
    await ui.navigate("overview")
  })
  ctx.capabilities.actions.register("today", async ({ capabilities, signal }) => {
    try { await openTodayJournal(capabilities, signal) }
    catch (error) { throw new Error(localizeError(error, ctx.i18n)) }
  })
}
