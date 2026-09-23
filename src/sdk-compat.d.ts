import "@eidos.space/plugin-sdk"

// Remove this augmentation once a published SDK includes plugin API 1.5.0.
declare module "@eidos.space/plugin-sdk" {
  interface HostUI {
    openOrCreateMarkdown(
      relativePath: string
    ): Promise<{ path: string; created: boolean }>
    listMarkdownFiles(
      folder: string
    ): Promise<{ paths: string[]; truncated: boolean }>
    countMarkdownLines(
      paths: string[]
    ): Promise<Array<{ path: string; lines: number | null }>>
    openMarkdownFile(relativePath: string): Promise<void>
    observeMarkdownFiles(
      folder: string,
      listener: () => void
    ): Promise<{ dispose(): void }>
  }
}
