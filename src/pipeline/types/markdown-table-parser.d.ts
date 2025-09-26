declare module 'markdown-table-parser' {
  export function parse(markdown: string): { header: string[]; data: Array<Record<string, unknown>> };
}
