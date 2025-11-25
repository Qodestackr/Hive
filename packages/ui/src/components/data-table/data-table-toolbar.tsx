"use client"

import type * as React from "react"
import type { Table } from "@tanstack/react-table"
import { X, Search, Filter, Download, Plus } from "lucide-react"
import { Button } from "../button"
import { Input } from "../input"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../dropdown-menu"

interface DataTableToolbarProps<TData> {
    table: Table<TData>
    search?: string
    onSearchChange?: (value: string) => void
    onAddNew?: () => void
    onExport?: () => void
    children?: React.ReactNode
}

export function DataTableToolbar<TData>({
    table,
    search = "",
    onSearchChange,
    onAddNew,
    onExport,
    children,
}: DataTableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search all columns..."
                        value={search}
                        onChange={(event) => onSearchChange?.(event.target.value)}
                        className="pl-8 h-9 w-[250px] lg:w-[300px]"
                    />
                </div>
                {isFiltered && (
                    <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
                        Reset
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
                {children}
            </div>
            <div className="flex items-center space-x-2">
                {onAddNew && (
                    <Button onClick={onAddNew} size="sm" className="h-8">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New
                    </Button>
                )}
                {onExport && (
                    <Button variant="outline" onClick={onExport} size="sm" className="h-8">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex">
                            <Filter className="mr-2 h-4 w-4" />
                            View
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table
                            .getAllColumns()
                            .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
