import type { ReactNode } from "react";

export function DataTable({
  headers,
  children,
  caption,
}: {
  headers: { label: string; srOnly?: boolean }[];
  children: ReactNode;
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full min-w-[36rem] border-collapse text-left text-[13px]">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-border bg-[#fafcfc] text-[12px] font-medium text-ink/50">
            <th className="w-10 px-3 py-2.5">
              <span className="sr-only">Select</span>
              <input type="checkbox" aria-label="Select all rows" className="align-middle" suppressHydrationWarning />
            </th>
            {headers.map((header) => (
              <th
                key={header.label}
                className={`px-3 py-2.5 ${header.srOnly ? "w-0 p-0" : ""}`}
              >
                {header.srOnly ? <span className="sr-only">{header.label}</span> : header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-ink">{children}</tbody>
      </table>
    </div>
  );
}

export function DataRow({
  children,
  selected,
}: {
  children: ReactNode;
  selected?: boolean;
}) {
  return (
    <tr className={`border-b border-border last:border-b-0 hover:bg-[#f7fafa] ${selected ? "bg-[#f7fafa]" : ""}`}>
      <td className="px-3 py-2.5">
        <input type="checkbox" aria-label="Select row" className="align-middle" suppressHydrationWarning />
      </td>
      {children}
    </tr>
  );
}
