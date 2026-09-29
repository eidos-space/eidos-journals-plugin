# Journals

Journals 0.5.0 要求 Eidos Lite 0.20.0 或更新版本，支持插件 API 3.0.0。不支持 CLI Serve。

从 [GitHub Releases](https://github.com/eidos-space/eidos-journals-plugin/releases) 下载 `eidos.journals-0.5.0.eidos-plugin`，然后在兼容的 Lite 构建中通过“插件 → 安装插件…”安装，并在 Space 中启用。发布附件包含安装包的 SHA-256 校验值。

通过 Eidos Lite 的命令面板执行“Open today's journal”，打开当天的 Markdown 日记。文件不存在时会创建目录和空文件；已存在时直接打开，不会覆盖内容。

在“插件 → Journals → Settings”中配置目标文件夹和文件组织方式。默认路径为 `journals/YYYY/MM/YYYY-MM-DD.md`；也可以选择按年分组或将所有日记放在同一目录。文件夹留空时写入当前 Space 根目录。日期以设备本地时间为准。

在命令面板打开 Journals 总览，可查看写作热力图、记录天数、连续记录和最近日志。通过年份选择器切换到有日志记录的年份；热力图、年度天数和最近日志会随之更新。热力图始终显示所选年份的 12 个月，首尾跨年的日期和未来日期显示为灰色补位格。颜色越深，表示当天 Markdown 文件的非空行越多。Journals 在本地读取 Markdown 文件并统计非空行，不会将正文发送给网络服务。Markdown 文件变化后总览会自动刷新，也可以手动点击“刷新”。

插件不需要账号或网络权限。安装时需要授予 Space 文件访问权限，用于读取日志、监听文件变化以及创建当天的日志。

从源码构建时，先运行 `pnpm install`，再运行 `pnpm check`、`pnpm test` 和 `pnpm pack:plugin`。项目使用已发布的 `@eidos.space/plugin-sdk` 和 `@eidos.space/plugin-tools` 0.5.0，无需 Eidos 源码仓库。
