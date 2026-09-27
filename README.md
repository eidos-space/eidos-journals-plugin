# Journals

Journals 0.4.0 requires Eidos Lite 0.19.0 or later and plugin API 2.0.0. CLI Serve is not supported.

Download `eidos.journals-0.4.0.eidos-plugin` from [GitHub Releases](https://github.com/eidos-space/eidos-journals-plugin/releases), then use **Plugins → Install plugin…** in a compatible Lite build and enable Journals in your Space. The release includes a SHA-256 checksum for the package.

Open today's Markdown journal from Eidos Lite's command palette. If the file does not exist, Journals creates the configured folders and an empty file; if it exists, Journals opens it without changing its contents.

Run **Open Journals overview** from the command palette to see a writing heatmap, total days, days in the selected year, current and longest streaks, and recent entries from that year. Use the year selector to switch between the current year and years with journal entries. The heatmap shows the full calendar year with neutral squares filling its first and last weeks; future days also remain neutral. Darker squares represent more non-empty lines in that day's Markdown file. Click a filled day or recent entry to open its existing file. The overview counts date-named Markdown files under the configured Journals folder, including files organized under older folder layouts. Lite counts lines locally and only returns counts to the plugin, never journal contents. The overview refreshes automatically when Markdown files change; **Refresh** is also available.

Configure **Journals folder** and **File organization** in Plugins → Journals → Settings. The default is `journals/YYYY/MM/YYYY-MM-DD.md`. You can also keep all files together (`YYYY-MM-DD.md`) or group by year (`YYYY/YYYY-MM-DD.md`). An empty folder setting writes to the Space root.

Journals uses local dates and stores files in the current Space. It needs no account or network access. The installation review explicitly grants permission to list Markdown file names, receive non-empty line counts, and watch for Markdown changes in the current Space so the overview can display writing activity.

To build from source, install dependencies with `pnpm install`, then run `pnpm check`, `pnpm test`, and `pnpm pack:plugin`. The package uses published `@eidos.space/plugin-sdk` and `@eidos.space/plugin-tools` 0.4.0.
