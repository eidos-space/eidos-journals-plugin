# Journals

Journals 0.5.3 requires Eidos Lite 0.20.0 or later and plugin API 3.0.0. CLI Serve is not supported.

Download `eidos.journals-0.5.3.eidos-plugin` from [GitHub Releases](https://github.com/eidos-space/eidos-journals-plugin/releases), then use **Plugins → Install plugin…** in a compatible Lite build and enable Journals in your Space. The release includes a SHA-256 checksum for the package.

Once enabled, **Journals** appears in the host navigation and opens the overview directly. Android builds with plugin Page navigation support show it in the bottom navigation (or **More** when the bar is full). Update the Android app to a build with this support before using that entry. The command-palette actions remain available.

Open today's Markdown journal with **Today's journal** at the top of the overview, or from Eidos Lite's command palette. If the file does not exist, Journals creates the configured folders and an empty file; if it exists, Journals opens it without changing its contents.

Run **Open Journals overview** from the command palette to see a writing heatmap, total days, days in the selected year, current and longest streaks, and recent entries from that year. Use the year selector to switch between the current year and years with journal entries. The heatmap shows the full calendar year with neutral squares filling its first and last weeks; future days also remain neutral. Darker squares represent more non-empty lines in that day's Markdown file. Click a filled day or recent entry to open its existing file. The overview counts date-named Markdown files under the configured Journals folder, including files organized under older folder layouts. Journals reads Markdown files locally to count their non-empty lines; their contents are not sent to a network service. The overview refreshes automatically when Markdown files change; **Refresh** is also available.

Configure **Journals folder** and **File organization** in Plugins → Journals → Settings. The default is `journals/YYYY/MM/YYYY-MM-DD.md`. You can also keep all files together (`YYYY-MM-DD.md`) or group by year (`YYYY/YYYY-MM-DD.md`). An empty folder setting writes to the Space root.

Journals uses local dates and stores files in the current Space. It needs no account or network access. Installation requires Space file access to read journal files, watch for changes, and create today's journal.

To build from source, install dependencies with `pnpm install`, then run `pnpm check`, `pnpm test`, and `pnpm pack:plugin`. The package uses published `@eidos.space/plugin-sdk` and `@eidos.space/plugin-tools` 0.5.0.

On mobile, the overview uses compact statistics, full-width recent-entry rows, and theme-aware neutral colors. The activity chart initially shows recent dates and preserves its scroll position on refresh. The Today shortcut remains available while statistics load.

On mobile, enable Journals again in each Space after updating. The overview declares write access so its Today's journal shortcut can create a missing file; opening an existing journal preserves its contents.
