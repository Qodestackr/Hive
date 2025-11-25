"use client"

import * as React from "react"
import { Input } from "../input"
import { Button } from "../button"
import { Check, X, Edit3 } from "lucide-react"
import { cn } from "../../lib/utils"

interface EditableCellProps {
    value: any
    rowIndex: number
    columnId: string
    isEditing: boolean
    onStartEdit: () => void
    onStopEdit: () => void
    onUpdate: (value: any) => void
    type?: "text" | "number" | "email" | "tel"
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function EditableCell({
    value,
    rowIndex,
    columnId,
    isEditing,
    onStartEdit,
    onStopEdit,
    onUpdate,
    type = "text",
    placeholder,
    className,
    disabled = false,
}: EditableCellProps) {
    const [editValue, setEditValue] = React.useState(value)
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    React.useEffect(() => {
        setEditValue(value)
    }, [value])

    const handleSave = () => {
        onUpdate(type === "number" ? Number(editValue) || 0 : editValue)
        onStopEdit()
    }

    const handleCancel = () => {
        setEditValue(value)
        onStopEdit()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleSave()
        } else if (e.key === "Escape") {
            e.preventDefault()
            handleCancel()
        }
    }

    if (disabled) {
        return <div className={cn("px-2 py-1 text-muted-foreground", className)}>{value || placeholder}</div>
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-1">
                <Input
                    ref={inputRef}
                    type={type}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    className="h-8 text-xs"
                    placeholder={placeholder}
                />
                <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave}>
                        <Check className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancel}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div
            className={cn(
                "group flex items-center justify-between px-2 py-1 hover:bg-muted/50 cursor-pointer rounded-sm transition-colors",
                className,
            )}
            onClick={onStartEdit}
        >
            <span className="flex-1 truncate">{value || <span className="text-muted-foreground">{placeholder}</span>}</span>
            <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        </div>
    )
}
