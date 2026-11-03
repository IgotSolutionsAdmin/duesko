/** RFC 4180 field. Quotes values that need it and doubles inner quotes. */
export function csvField(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

/** UTF-8 CSV with a BOM so spreadsheet apps keep peso text intact. */
export function csvDocument(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const lines = [
    headers.map(csvField).join(","),
    ...rows.map((row) => row.map(csvField).join(",")),
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
