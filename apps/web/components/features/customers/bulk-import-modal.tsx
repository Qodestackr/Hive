"use client";

import { useState } from "react";
import { useBulkImportCustomers } from "@/lib/api-client";
import { Button } from "@repo/ui/components/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";

export function BulkImportModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const importMutation = useBulkImportCustomers();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.type !== "text/csv") {
            toast.error("Please upload a CSV file");
            return;
        }

        setFile(selectedFile);

        // Simple CSV parse for preview
        const text = await selectedFile.text();
        const lines = text.split("\n");
        const headers = lines[0].split(",");
        const previewData = lines.slice(1, 6).map(line => {
            const values = line.split(",");
            return headers.reduce((obj, header, i) => {
                obj[header.trim()] = values[i]?.trim();
                return obj;
            }, {} as any);
        }).filter(row => row.phone); // Basic filter

        setPreview(previewData);
    };

    const handleImport = async () => {
        if (!file) return;

        const text = await file.text();
        // In a real app, we'd parse this properly. 
        // For now, assuming the API accepts the raw CSV or a JSON array.
        // Based on the domain wrapper, it expects a JSON body.

        // Simple CSV to JSON parser
        const lines = text.split("\n");
        const headers = lines[0].split(",").map(h => h.trim());
        const customers = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
                const values = line.split(",");
                const customer: any = {};
                headers.forEach((header, i) => {
                    if (values[i]) customer[header] = values[i].trim();
                });
                return customer;
            });

        try {
            await importMutation.mutateAsync({ customers }, {
                onSuccess: (data) => {
                    toast.success(`Successfully imported ${data.count} customers`);
                    setIsOpen(false);
                    setFile(null);
                    setPreview([]);
                }
            });
        } catch (error) {
            toast.error("Failed to import customers");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Import
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Import Customers</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with columns: phone, name, email.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="csv">CSV File</Label>
                        <Input
                            id="csv"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                        />
                    </div>

                    {file && (
                        <div className="rounded-md border p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <span className="font-medium text-sm">{file.name}</span>
                                <span className="text-xs text-zinc-500">
                                    ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                            </div>

                            {preview.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-zinc-500">Preview (first 5 rows):</p>
                                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded p-2 text-xs font-mono overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr>
                                                    {Object.keys(preview[0]).map(key => (
                                                        <th key={key} className="p-1 border-b">{key}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {preview.map((row, i) => (
                                                    <tr key={i}>
                                                        {Object.values(row).map((val: any, j) => (
                                                            <td key={j} className="p-1">{val}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Format Requirements</AlertTitle>
                        <AlertDescription>
                            Phone numbers must be in international format (e.g., +254...).
                            Duplicates will be skipped.
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!file || importMutation.isPending}
                    >
                        {importMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Import Customers
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
