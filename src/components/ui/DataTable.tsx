"use client";

import { useMemo, type ReactNode } from "react";
import {
  createColumnHelper,
  createPaginatedRowModel,
  functionalUpdate,
  rowPaginationFeature,
  rowSelectionFeature,
  tableFeatures,
  useTable,
  type CellData,
  type ColumnDef,
  type RowData,
  type RowSelectionState,
  type TableFeatures,
  type Updater,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Skeleton } from "./Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./Table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- must match the library's declaration
  interface ColumnMeta<in out TFeatures extends TableFeatures, in out TData extends RowData, TValue extends CellData = CellData> {
    /** Classes for this column's header and cells, e.g. "hidden sm:table-cell". */
    className?: string;
  }
}

type RowId = number | string;

export const dataTableFeatures = tableFeatures({
  rowSelectionFeature,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});
type Features = typeof dataTableFeatures;

/** Column helper for DataTable: `const columns = dataTableColumns<Row>()`. */
export const dataTableColumns = <TData extends RowData>() => createColumnHelper<Features, TData>();

interface DataTableProps<TData extends RowData> {
  /** Build with `dataTableColumns<TData>().columns([...])`. */
  columns: ColumnDef<Features, TData, unknown>[];
  data: TData[];
  getRowId: (row: TData) => RowId;
  /** Adds a checkbox column. Ids keep the order they were picked in. */
  selectedIds?: RowId[];
  onSelectedIdsChange?: (ids: RowId[]) => void;
  pageSize?: number;
  loading?: boolean;
  empty?: ReactNode;
  "aria-label"?: string;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  selectedIds,
  onSelectedIdsChange,
  pageSize = 10,
  loading = false,
  empty,
  "aria-label": ariaLabel,
}: DataTableProps<TData>) {
  const selectable = Boolean(onSelectedIdsChange);
  const selected = useMemo(() => selectedIds ?? [], [selectedIds]);
  const rowSelection = useMemo<RowSelectionState>(
    () => Object.fromEntries(selected.map((id) => [String(id), true])),
    [selected]
  );

  // Turn the table's selection map back into ids: kept ones stay in place,
  // newly picked ones follow in table order (as antd's table did).
  const handleRowSelectionChange = (updater: Updater<RowSelectionState>) => {
    const next = functionalUpdate(updater, rowSelection);
    const nextKeys = new Set(Object.keys(next).filter((key) => next[key]));
    const kept = selected.filter((id) => nextKeys.has(String(id)));
    const keptKeys = new Set(kept.map(String));
    const added = data
      .map(getRowId)
      .filter((id) => nextKeys.has(String(id)) && !keptKeys.has(String(id)));
    onSelectedIdsChange?.([...kept, ...added]);
  };

  const allColumns = useMemo<ColumnDef<Features, TData, unknown>[]>(() => {
    if (!selectable) return columns;
    const helper = createColumnHelper<Features, TData>();
    return [
      helper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all rows on this page"
            checked={
              table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label="Select row"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(value === true)}
          />
        ),
      }),
      ...columns,
    ];
  }, [columns, selectable]);

  const table = useTable({
    features: dataTableFeatures,
    columns: allColumns,
    data,
    getRowId: (row: TData) => String(getRowId(row)),
    enableRowSelection: selectable,
    state: { rowSelection },
    onRowSelectionChange: handleRowSelectionChange,
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();
  const { pageIndex } = table.state.pagination;
  const total = table.getRowCount();
  const first = total === 0 ? 0 : pageIndex * pageSize + 1;
  const last = Math.min(total, (pageIndex + 1) * pageSize);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <Table aria-label={ariaLabel}>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {group.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(header.column.id === "select" && "w-12", header.column.columnDef.meta?.className)}
                >
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 4 }, (_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                {allColumns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-5 w-full max-w-48" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length ? (
            rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={allColumns.length}>{empty}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {!loading && pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span>
            {first}–{last} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <span className="tabular-nums">
              Page {pageIndex + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
