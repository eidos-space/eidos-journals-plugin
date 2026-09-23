import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const eidosRoot = process.env.EIDOS_REPO_DIR
  ? path.resolve(process.env.EIDOS_REPO_DIR)
  : path.resolve(root, "../../eidos")
const local = path.join(eidosRoot, "packages/plugin-tools/bin/eidos-plugin.mjs")
if (!existsSync(local)) {
  console.error(
    "Journals requires the Eidos development plugin tools for API 1.5.0. Set EIDOS_REPO_DIR to an Eidos checkout with those tools."
  )
  process.exit(1)
}
const result = spawnSync(process.execPath, [local, ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit",
})
if (result.error) throw result.error
process.exit(result.status ?? 1)
