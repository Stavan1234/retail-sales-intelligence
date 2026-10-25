"use client";

import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { TransactionRow } from "@/types/analytics";

const features = tableFeatures({});
type TransactionFeatures = typeof features;

const columnHelper = createColumnHelper<TransactionFeatures, TransactionRow>();

const columns = columnHelper.columns([
  columnHelper.accessor("Order ID", { header: "Order" }),
  columnHelper.accessor("Order Date", { header: "Date" }),
  columnHelper.accessor("Customer Name", { header: "Customer" }),
  columnHelper.accessor("Category", { header: "Category" }),
  columnHelper.accessor("Region", { header: "Region" }),
  columnHelper.accessor("Sales", {
    header: "Sales",
    cell: (info) => formatCurrency(info.getValue()),
  }),
  columnHelper.accessor("Quantity", {
    header: "Qty",
    cell: (info) => formatNumber(info.getValue()),
  }),
  columnHelper.accessor("Discount", {
    header: "Discount",
    cell: (info) => formatPercent(info.getValue(), 0),
  }),
  columnHelper.accessor("Profit", {
    header: "Profit",
    cell: (info) => formatCurrency(info.getValue()),
  }),
]);

export function TransactionTable({ rows }: { rows: TransactionRow[] }) {
  const table = useTable({
    key: "transactions",
    features,
    columns,
    data: rows,
  });

  return (
    <table>
      <caption className="sr-only">Retail transaction results</caption>
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => (
              <th key={header.id} scope="col">
                {header.isPlaceholder ? null : <table.FlexRender header={header} />}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="table-empty">
              No transactions match the current filters.
            </td>
          </tr>
        ) : (
          table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getAllCells().map((cell) => (
                <td key={cell.id}>
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
