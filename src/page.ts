import type { Mount } from "@eidos.space/plugin-sdk"
import { openTodayJournal } from "./journal"
import { localizeError } from "./errors"
import {
  calendarYearRange,
  dateIndex,
  indexDate,
  journalDateFromPath,
  localDateKey,
  summarizeJournals,
} from "./stats"
import "./page.css"


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
  const capabilities = ctx.capabilities
  if (!capabilities.fs || !capabilities.settings || !capabilities.ui.openFile) throw new Error("Journals requires filesystem, settings and file navigation")
  const fs = capabilities.fs
  const settings = capabilities.settings
  const openFile = capabilities.ui.openFile

  if (ctx.binding.kind !== "page") throw new Error("Open the Journals page")
  const labels = () => ({
    eyebrow: ctx.i18n.t("ui.eyebrow"),
    title: ctx.i18n.t("ui.title"),
    subtitle: ctx.i18n.t("ui.subtitle"),
    refresh: ctx.i18n.t("ui.refresh"),
    today: ctx.i18n.t("ui.today"),
    opening: ctx.i18n.t("ui.opening"),
    loading: ctx.i18n.t("ui.loading"),
    empty: ctx.i18n.t("ui.empty"),
    emptyDetail: ctx.i18n.t("ui.emptyDetail"),
    total: ctx.i18n.t("ui.total"),
    year: (year: number) => ctx.i18n.t("ui.year", { year }),
    current: ctx.i18n.t("ui.current"),
    longest: ctx.i18n.t("ui.longest"),
    activity: ctx.i18n.t("ui.activity"),
    selectYear: ctx.i18n.t("ui.selectYear"),
    activityDetail: ctx.i18n.t("ui.activityDetail"),
    recent: ctx.i18n.t("ui.recent"),
    less: ctx.i18n.t("ui.less"),
    more: ctx.i18n.t("ui.more"),
    noEntry: ctx.i18n.t("ui.noEntry"),
    line: ctx.i18n.t("ui.line"),
    lines: ctx.i18n.t("ui.lines"),
    unknownLines: ctx.i18n.t("ui.unknownLines"),
    days: ctx.i18n.t("ui.days"),
    truncated: ctx.i18n.t("ui.truncated"),
    retry: ctx.i18n.t("ui.retry"),
    noRecent: ctx.i18n.t("ui.noRecent"),
  })
  let t = labels()
  let locale = ctx.i18n.locale
  let dateFormat = new Intl.DateTimeFormat(locale, {
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
  const todayButton = element("button", "jn-today")
  todayButton.type = "button"
  const todayLabel = element("strong", "jn-today-label", t.today)
  const todayDate = element("span", "jn-today-date")
  const updateTodayDate = () => {
    todayDate.textContent = new Intl.DateTimeFormat(locale, {
      month: "long", day: "numeric", weekday: "long",
    }).format(new Date())
  }
  updateTodayDate()
  const todayText = element("span", "jn-today-text")
  todayText.append(todayLabel, todayDate)
  const todayIcon = element("span", "jn-today-icon", "+")
  todayIcon.setAttribute("aria-hidden", "true")
  todayButton.append(todayIcon, todayText, element("span", "jn-today-arrow", "›"))
  const content = element("div", "jn-content")
  content.append(element("p", "jn-status", t.loading))
  shell.append(header, todayButton, content)
  root.replaceChildren(shell)

  let pending = false
  let reloadQueued = false
  let disposed = false
  let watchFolder: string | null = null
  let watchSubscription: { dispose(): void } | null = null
  let reloadTimer: ReturnType<typeof setTimeout> | null = null
  let selectedYear = new Date().getFullYear()
  let yearSelector: HTMLSelectElement | null = null
  let chartYear: number | null = null
  todayButton.addEventListener("click", async () => {
    if (todayButton.disabled || disposed || ctx.signal.aborted) return
    todayButton.disabled = true
    todayLabel.textContent = t.opening
    try {
      await openTodayJournal(capabilities, ctx.signal)
    } catch (error) {
      if (!ctx.signal.aborted) showError(error)
    } finally {
      if (!disposed) {
        todayButton.disabled = false
        todayLabel.textContent = t.today
        updateTodayDate()
      }
    }
  })
  const onVisible = () => {
    if (document.visibilityState === "visible") updateTodayDate()
  }
  document.addEventListener("visibilitychange", onVisible)
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
      const folder = await settings.get("folder")
      if (typeof folder !== "string") throw new Error("Invalid Journals folder")
      const normalizedFolder = folder.trim().replace(/\/$/, "")
      if (watchFolder !== normalizedFolder) {
        const next = await fs.watch(
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
      const files = await fs.list(normalizedFolder, {
        extensions: [".md"],
      })
      if (disposed || ctx.signal.aborted) return
      const paths = files.map((f) => f.path)
      const today = new Date()
      const stats = summarizeJournals(paths, today)
      const datePaths = new Map<string, string>()
      for (const path of paths) {
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
      const lineCounts = new Map<string, number | null>()
      let countCursor = 0
      await Promise.all(
        Array.from({ length: Math.min(8, pathsToCount.length) }, async () => {
          while (countCursor < pathsToCount.length) {
            const path = pathsToCount[countCursor++]!
            try {
              const text = await fs.readText(path)
              lineCounts.set(
                path,
                text
                  .split(/\r\n|\r|\n/)
                  .filter((line) => line.trim().length > 0).length
              )
            } catch {
              lineCounts.set(path, null)
            }
          }
        })
      )
      if (disposed || ctx.signal.aborted) return

      const previousScroll = chartYear === displayYear
        ? content.querySelector<HTMLElement>(".jn-heatmap-scroll")?.scrollLeft
        : undefined
      content.replaceChildren()
      if (files.length >= 20_000)
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
      scroll.tabIndex = 0
      scroll.setAttribute("role", "region")
      scroll.setAttribute("aria-label", t.activity)
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
              if (path) void openFile(path).catch(showError)
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
      // Keep recent dates visible on narrow screens, retaining the user's position on refresh.
      const focusDate = displayYear === today.getFullYear()
        ? todayKey
        : selectedDates.at(-1)
      const focusWeek = focusDate ? Math.floor((dateIndex(focusDate) - first) / 7) : 0
      scroll.scrollLeft = previousScroll ?? Math.max(0, focusWeek * 16 - scroll.clientWidth / 2)
      chartYear = displayYear

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
          element("span", "jn-recent-arrow", "›")
        )
        item.addEventListener("click", () => {
          void openFile(path).catch(showError)
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
    const message = localizeError(error, ctx.i18n)
    const alert = element("p", "jn-error", message)
    alert.setAttribute("role", "alert")
    content.prepend(alert)
  }

  refresh.addEventListener("click", () => {
    void load()
  })
  ctx.subscriptions.add(ctx.i18n.onDidChangeLocale(() => {
    if (disposed) return
    t = labels()
    locale = ctx.i18n.locale
    dateFormat = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" })
    heading.children[0]!.textContent = t.eyebrow
    heading.children[1]!.textContent = t.title
    heading.children[2]!.textContent = t.subtitle
    refresh.textContent = t.refresh
    todayLabel.textContent = todayButton.disabled ? t.opening : t.today
    updateTodayDate()
    scheduleLoad()
  }))
  void load()
  return {
    dispose() {
      disposed = true
      document.removeEventListener("visibilitychange", onVisible)
      if (reloadTimer) clearTimeout(reloadTimer)
      watchSubscription?.dispose()
      root.replaceChildren()
    },
  }
}

export default mount
