"use client"

import type * as React from "react"
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table"
import { getCommonPinningStyles } from "../../lib/data-table-utils"
import { cn } from "../../lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import { BulkOperationsBar } from "./bulk-operations-bar"

interface DataTableProps<TData> extends React.HTMLAttributes<HTMLDivElement> {
    table: TanstackTable<TData>
    search?: string
    onSearchChange?: (value: string) => void
    onAddNew?: () => void
    onExport?: () => void
    onBulkDelete?: (selectedRows: TData[]) => void
    onBulkEdit?: (selectedRows: TData[]) => void
    onBulkExport?: (selectedRows: TData[]) => void
    onBulkArchive?: (selectedRows: TData[]) => void
    onBulkSend?: (selectedRows: TData[]) => void
    customBulkActions?: Array<{
        label: string
        icon: React.ComponentType<{ className?: string }>
        onClick: (selectedRows: TData[]) => void
        variant?: "default" | "destructive" | "outline" | "secondary"
    }>
    floatingBar?: React.ReactNode | null
    toolbar?: React.ReactNode
    showToolbar?: boolean
    showPagination?: boolean
    showBulkOperations?: boolean
}

export function DataTable<TData>({
    table,
    search,
    onSearchChange,
    onAddNew,
    onExport,
    onBulkDelete,
    onBulkEdit,
    onBulkExport,
    onBulkArchive,
    onBulkSend,
    customBulkActions = [],
    floatingBar = null,
    toolbar,
    showToolbar = true,
    showPagination = true,
    showBulkOperations = true,
    className,
    ...props
}: DataTableProps<TData>) {
    return (
        <div className={cn("w-full space-y-4", className)} {...props}>
            {showToolbar && (
                <div>
                    {toolbar || (
                        <DataTableToolbar
                            table={table}
                            search={search}
                            onSearchChange={onSearchChange}
                            onAddNew={onAddNew}
                            onExport={onExport}
                        />
                    )}
                </div>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            style={{
                                                ...getCommonPinningStyles({ column: header.column }),
                                            }}
                                            className="bg-muted/50"
                                        >
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-muted/30">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            style={{
                                                ...getCommonPinningStyles({ column: cell.column }),
                                            }}
                                            className="p-0"
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col gap-2.5">
                {showPagination && <DataTablePagination table={table} />}
                {table.getFilteredSelectedRowModel().rows.length > 0 && floatingBar}
            </div>
            {showBulkOperations && (
                <BulkOperationsBar
                    table={table}
                    onBulkDelete={onBulkDelete}
                    onBulkEdit={onBulkEdit}
                    onBulkExport={onBulkExport}
                    onBulkArchive={onBulkArchive}
                    onBulkSend={onBulkSend}
                    customActions={customBulkActions}
                />
            )}
        </div>
    )
}
