import type { Mount } from "@eidos.space/plugin-sdk"
import {
  calendarYearRange,
  dateIndex,
  indexDate,
  journalDateFromPath,
  localDateKey,
  summarizeJournals,
} from "./stats"
import "./page.css"

const copy = {
  en: {
    eyebrow: "YOUR WRITING",
    title: "Journals",
    subtitle: "A quiet record of your days, kept in your own files.",
    refresh: "Refresh",
    loading: "Looking for journal entries…",
    empty: "Your journal starts with a single day.",
    emptyDetail:
      "Use “Open today's journal” from the command palette to create your first entry.",
    total: "Days written",
    year: (year: number) => `Days in ${year}`,
    current: "Current streak",
    longest: "Longest streak",
    activity: "Writing activity",
    selectYear: "Select year",
    activityDetail:
      "Darker squares mean more non-empty lines written that day.",
    recent: "Recent entries",
    less: "Less",
    more: "More",
    noEntry: "No entry",
    line: "non-empty line",
    lines: "non-empty lines",
    unknownLines: "Line count unavailable",
    days: "days",
    truncated:
      "The journal folder has more files than the page can count. Statistics may be incomplete.",
    retry: "Try again",
    noRecent: "No journal entries yet",
  },
  zh: {
    eyebrow: "写作记录",
    title: "日志",
    subtitle: "日子写进文件，始终留在自己手中。",
    refresh: "刷新",
    loading: "正在查找日志…",
    empty: "从今天开始记录。",
    emptyDetail: "在命令面板运行“打开今天的日志”，即可创建第一篇。",
    total: "记录天数",
    year: (year: number) => `${year} 年记录`,
    current: "当前连续",
    longest: "最长连续",
    activity: "记录热力图",
    selectYear: "选择年份",
    activityDetail: "颜色越深，表示当天日志的非空行越多。",
    recent: "最近日志",
    less: "少",
    more: "多",
    noEntry: "未记录",
    line: "非空行",
    lines: "非空行",
    unknownLines: "无法统计行数",
    days: "天",
    truncated: "日志文件过多，统计可能不完整。",
    retry: "重试",
    noRecent: "还没有日志",
  },
} as const

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const mount: Mount = (ctx, root) => {
  if (ctx.binding.kind !== "page") throw new Error("Open the Journals page")
  const language = navigator.language.toLowerCase().startsWith("zh")
    ? "zh"
    : "en"
  const t = copy[language]
  const locale = language === "zh" ? "zh-CN" : "en-US"
  const dateFormat = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
  const shell = element("main", "jn-page")
  const header = element("header", "jn-header")
  const heading = element("div", "jn-heading")
  heading.append(
    element("div", "jn-eyebrow", t.eyebrow),
    element("h1", "jn-title", t.title),
    element("p", "jn-subtitle", t.subtitle)
  )
  const refresh = element("button", "jn-refresh", t.refresh)
  refresh.type = "button"
  header.append(heading, refresh)
  const content = element("div", "jn-content")
  content.append(element("p", "jn-status", t.loading))
  shell.append(header, content)
  root.replaceChildren(shell)

  let pending = false
  let reloadQueued = false
  let disposed = false
  let watchFolder: string | null = null
  let watchSubscription: { dispose(): void } | null = null
  let reloadTimer: ReturnType<typeof setTimeout> | null = null
  let selectedYear = new Date().getFullYear()
  let yearSelector: HTMLSelectElement | null = null
  function scheduleLoad() {
    if (disposed) return
    if (reloadTimer) clearTimeout(reloadTimer)
    reloadTimer = setTimeout(() => {
      reloadTimer = null
      if (pending) reloadQueued = true
      else void load()
    }, 250)
  }
  async function load() {
    if (disposed) return
    if (pending) {
      reloadQueued = true
      return
    }
    pending = true
    refresh.disabled = true
    if (yearSelector) yearSelector.disabled = true
    try {
      const folder = await ctx.settings.get("folder")
      if (typeof folder !== "string") throw new Error("Invalid Journals folder")
      const normalizedFolder = folder.trim().replace(/\/$/, "")
      if (watchFolder !== normalizedFolder) {
        const next = await ctx.ui.observeMarkdownFiles(
          normalizedFolder,
          scheduleLoad
        )
        if (disposed || ctx.signal.aborted) {
          next.dispose()
          return
        }
        watchSubscription?.dispose()
        watchSubscription = next
        watchFolder = normalizedFolder
      }
      const result = await ctx.ui.listMarkdownFiles(normalizedFolder)
      if (disposed || ctx.signal.aborted) return
      const today = new Date()
      const stats = summarizeJournals(result.paths, today)
      const datePaths = new Map<string, string>()
      for (const path of result.paths) {
        const date = journalDateFromPath(path)
        if (date && !datePaths.has(date)) datePaths.set(date, path)
      }
      const todayKey = localDateKey(today)
      const availableYears = [
        ...new Set([
          today.getFullYear(),
          ...stats.dates
            .filter((date) => date <= todayKey)
            .map((date) => Number(date.slice(0, 4))),
        ]),
      ].sort((left, right) => right - left)
      if (!availableYears.includes(selectedYear))
        selectedYear = today.getFullYear()
      const displayYear = selectedYear
      const { first, last, through, yearStart, yearEnd } = calendarYearRange(
        displayYear,
        today
      )
      const selectedDates = stats.dates.filter((date) => {
        const index = dateIndex(date)
        return index >= yearStart && index <= through
      })
      const pathsToCount = [...datePaths]
        .filter(([date]) => {
          const index = dateIndex(date)
          return index >= yearStart && index <= through
        })
        .map(([, path]) => path)
      const lineCounts = new Map(
        (await ctx.ui.countMarkdownLines(pathsToCount)).map(
          ({ path, lines }) => [path, lines]
        )
      )
      if (disposed || ctx.signal.aborted) return

      content.replaceChildren()
      if (result.truncated)
        content.append(element("p", "jn-warning", t.truncated))
      const metrics = element("section", "jn-metrics")
      for (const [label, number, suffix] of [
        [t.total, stats.total, ""],
        [t.year(displayYear), selectedDates.length, ""],
        [t.current, stats.currentStreak, t.days],
        [t.longest, stats.longestStreak, t.days],
      ] as const) {
        const card = element("div", "jn-metric")
        card.append(
          element("span", "jn-metric-label", label),
          element(
            "strong",
            "jn-metric-value",
            `${number}${suffix ? ` ${suffix}` : ""}`
          )
        )
        metrics.append(card)
      }
      content.append(metrics)

      const activity = element("section", "jn-section")
      const activityHeader = element("div", "jn-section-header")
      const activityHeading = element("div", "jn-activity-heading")
      activityHeading.append(
        element("h2", "jn-section-title", t.activity),
        element("p", "jn-section-detail", t.activityDetail)
      )
      const nextYearSelector = element("select", "jn-year-select")
      nextYearSelector.setAttribute("aria-label", t.selectYear)
      for (const year of availableYears) {
        const option = element("option", "", String(year))
        option.value = String(year)
        nextYearSelector.append(option)
      }
      nextYearSelector.value = String(displayYear)
      nextYearSelector.addEventListener("change", () => {
        selectedYear = Number(nextYearSelector.value)
        void load()
      })
      yearSelector = nextYearSelector
      activityHeader.append(activityHeading, nextYearSelector)
      activity.append(activityHeader)
      const scroll = element("div", "jn-heatmap-scroll")
      const chart = element("div", "jn-chart")
      const daySet = new Set(selectedDates)
      const months = element("div", "jn-months")
      const weeks = element("div", "jn-weeks")
      let previousMonth = -1
      for (let week = first; week <= last; week += 7) {
        const column = element("div", "jn-week")
        const monthDate = indexDate(
          Math.max(yearStart, Math.min(week + 3, yearEnd))
        )
        const monthNumber = monthDate.getUTCMonth()
        const month = element(
          "span",
          "jn-month",
          monthNumber !== previousMonth
            ? new Intl.DateTimeFormat(locale, { month: "short" }).format(
                monthDate
              )
            : ""
        )
        previousMonth = monthNumber
        months.append(month)
        for (let weekday = 0; weekday < 7; weekday++) {
          const index = week + weekday
          const date = indexDate(index)
          const key = date.toISOString().slice(0, 10)
          const hasEntry = daySet.has(key)
          const lines = hasEntry
            ? (lineCounts.get(datePaths.get(key)!) ?? null)
            : null
          const level = !hasEntry
            ? 0
            : lines === null || lines < 5
              ? 1
              : lines < 20
                ? 2
                : lines < 50
                  ? 3
                  : 4
          const cell = element(
            "button",
            `jn-day${hasEntry ? ` jn-day-active jn-day-level-${level}` : ""}`
          )
          cell.type = "button"
          cell.disabled = !hasEntry
          const description = hasEntry
            ? lines === null
              ? t.unknownLines
              : `${lines} ${lines === 1 ? t.line : t.lines}`
            : t.noEntry
          cell.setAttribute(
            "aria-label",
            `${dateFormat.format(date)} · ${description}`
          )
          cell.title = `${dateFormat.format(date)} · ${description}`
          if (hasEntry) {
            cell.addEventListener("click", () => {
              const path = datePaths.get(key)
              if (path) void ctx.ui.openMarkdownFile(path).catch(showError)
            })
          }
          column.append(cell)
        }
        weeks.append(column)
      }
      chart.append(months, weeks)
      scroll.append(chart)
      activity.append(scroll)
      const legend = element("div", "jn-legend")
      legend.append(
        element("span", "", t.less),
        element("i", "jn-legend-empty"),
        ...[1, 2, 3, 4].map((level) => element("i", `jn-day-level-${level}`)),
        element("span", "", t.more)
      )
      activity.append(legend)
      content.append(activity)

      const recent = element("section", "jn-section")
      recent.append(element("h2", "jn-section-title", t.recent))
      const list = element("div", "jn-recent")
      for (const date of selectedDates.slice(-8).reverse()) {
        const path = datePaths.get(date)
        if (!path) continue
        const item = element("button", "jn-recent-item")
        item.type = "button"
        item.append(
          element(
            "span",
            "jn-recent-date",
            dateFormat.format(indexDate(dateIndex(date)))
          ),
          element("span", "jn-recent-path", path),
          element("span", "jn-recent-arrow", "↗")
        )
        item.addEventListener("click", () => {
          void ctx.ui.openMarkdownFile(path).catch(showError)
        })
        list.append(item)
      }
      if (!list.childElementCount)
        list.append(element("p", "jn-empty", `${t.empty} ${t.emptyDetail}`))
      recent.append(list)
      content.append(recent)
    } catch (error) {
      if (!disposed) showError(error)
    } finally {
      pending = false
      refresh.disabled = false
      if (yearSelector) yearSelector.disabled = false
      if (reloadQueued && !disposed) {
        reloadQueued = false
        scheduleLoad()
      }
    }
  }

  function showError(error: unknown) {
    if (disposed) return
    const message = error instanceof Error ? error.message : String(error)
    const alert = element("p", "jn-error", message)
    alert.setAttribute("role", "alert")
    content.prepend(alert)
  }

  refresh.addEventListener("click", () => {
    void load()
  })
  void load()
  return {
    dispose() {
      disposed = true
      if (reloadTimer) clearTimeout(reloadTimer)
      watchSubscription?.dispose()
      root.replaceChildren()
    },
  }
}

export default mount
