import type { PluginI18n } from "@eidos.space/plugin-sdk"

const errors: Record<string, string> = {
  "File access unavailable": "error.fileAccess",
  "Invalid Journals settings": "error.settings",
  "The journal path is a folder": "error.folder",
  "Invalid journal date": "error.date",
  "Journals folder must be a safe Space-relative path": "error.path",
  "Invalid organization style": "error.organization",
  "Page navigation unavailable": "error.navigation",
}
export function localizeError(error: unknown, i18n: PluginI18n): string {
  const message = error instanceof Error ? error.message : String(error)
  return errors[message] ? i18n.t(errors[message]!) : message
}
