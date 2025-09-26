// Tell TypeScript that this module exists and has a `parse` function.
declare module 'markdown-table-parser' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function parse(markdown: string): any;
}
