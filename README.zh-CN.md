# Journals

Journals 是面向插件 API 1.5.0 或更高版本的 Eidos Lite 开发构建的预览插件。已发布的 Eidos Lite 0.17.0 仅支持插件 API 1.1.0，无法安装此版本；CLI Serve 也不支持。

从 [GitHub Releases](https://github.com/eidos-space/eidos-journals-plugin/releases) 下载 `eidos.journals-0.3.3.eidos-plugin`，然后在兼容的 Lite 构建中通过“插件 → 安装插件…”安装，并在 Space 中启用。发布附件包含安装包的 SHA-256 校验值。

通过 Eidos Lite 的命令面板执行“Open today's journal”，打开当天的 Markdown 日记。文件不存在时会创建目录和空文件；已存在时直接打开，不会覆盖内容。

在“插件 → Journals → Settings”中配置目标文件夹和文件组织方式。默认路径为 `journals/YYYY/MM/YYYY-MM-DD.md`；也可以选择按年分组或将所有日记放在同一目录。文件夹留空时写入当前 Space 根目录。日期以设备本地时间为准。

在命令面板打开 Journals 总览，可查看写作热力图、记录天数、连续记录和最近日志。通过年份选择器切换到有日志记录的年份；热力图、年度天数和最近日志会随之更新。热力图始终显示所选年份的 12 个月，首尾跨年的日期和未来日期显示为灰色补位格。颜色越深，表示当天 Markdown 文件的非空行越多。行数由 Lite 在本地统计，插件不会收到日记正文。Markdown 文件变化后总览会自动刷新，也可以手动点击“刷新”。

插件不需要账号或网络权限；安装时会声明文件名枚举、行数统计与 Markdown 变更通知权限。

从源码构建时，需要安装本仓库及支持插件 API 1.5.0 的 Eidos 源码依赖，设置 `EIDOS_REPO_DIR` 指向 Eidos 仓库后运行 `pnpm check`、`pnpm test` 和 `pnpm pack:plugin`。目前 npm 上的 `@eidos.space/plugin-tools` 0.2.0 尚不能打包此插件的 manifest。
