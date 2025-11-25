"use client"

import type * as React from "react"
import type { Table } from "@tanstack/react-table"
import { X, Trash2, Download, Edit, Archive, Send } from "lucide-react"
import { Button } from "../button"
import { Separator } from "../separator"
import { Badge } from "../badge"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../dropdown-menu"

interface BulkOperationsBarProps<TData> {
    table: Table<TData>
    onBulkDelete?: (selectedRows: TData[]) => void
    onBulkEdit?: (selectedRows: TData[]) => void
    onBulkExport?: (selectedRows: TData[]) => void
    onBulkArchive?: (selectedRows: TData[]) => void
    onBulkSend?: (selectedRows: TData[]) => void
    customActions?: Array<{
        label: string
        icon: React.ComponentType<{ className?: string }>
        onClick: (selectedRows: TData[]) => void
        variant?: "default" | "destructive" | "outline" | "secondary"
    }>
}

export function BulkOperationsBar<TData>({
    table,
    onBulkDelete,
    onBulkEdit,
    onBulkExport,
    onBulkArchive,
    onBulkSend,
    customActions = [],
}: BulkOperationsBarProps<TData>) {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedCount = selectedRows.length

    if (selectedCount === 0) return null

    const selectedData = selectedRows.map((row) => row.original)

    const handleClearSelection = () => {
        table.toggleAllRowsSelected(false)
    }

    const handleBulkAction = (action: () => void, actionName: string) => {
        action()
        toast.success(`${actionName} completed for ${selectedCount} items`)
        handleClearSelection()
    }

    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3 min-w-[400px]">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {selectedCount} selected
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={handleClearSelection} className="h-6 w-6 p-0">
                        <X className="h-3 w-3" />
                    </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-1">
                    {onBulkEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkAction(() => onBulkEdit(selectedData), "Bulk edit")}
                            className="h-8"
                        >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                        </Button>
                    )}

                    {onBulkExport && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkAction(() => onBulkExport(selectedData), "Export")}
                            className="h-8"
                        >
                            <Download className="h-3 w-3 mr-1" />
                            Export
                        </Button>
                    )}

                    {onBulkSend && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkAction(() => onBulkSend(selectedData), "Send")}
                            className="h-8"
                        >
                            <Send className="h-3 w-3 mr-1" />
                            Send
                        </Button>
                    )}

                    {customActions.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8">
                                    More Actions
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {customActions.map((action, index) => (
                                    <DropdownMenuItem
                                        key={index}
                                        onClick={() => handleBulkAction(() => action.onClick(selectedData), action.label)}
                                    >
                                        <action.icon className="mr-2 h-4 w-4" />
                                        {action.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {(onBulkDelete || onBulkArchive) && (
                        <>
                            <Separator orientation="vertical" className="h-6" />
                            {onBulkArchive && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBulkAction(() => onBulkArchive(selectedData), "Archive")}
                                    className="h-8"
                                >
                                    <Archive className="h-3 w-3 mr-1" />
                                    Archive
                                </Button>
                            )}
                            {onBulkDelete && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleBulkAction(() => onBulkDelete(selectedData), "Delete")}
                                    className="h-8"
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
