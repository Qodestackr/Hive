/**
 * Product Creation/Edit Form
 * 
 * Reusable form component for creating and editing products
 * Uses Zod schemas for validation
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateProduct, useUpdateProduct } from "@/lib/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";

interface ProductFormData {
    name: string;
    sku: string;
    brand?: string;
    category?: string;
    basePrice: number;
    description?: string;
    status?: "active" | "inactive";
}

interface ProductFormProps {
    initialData?: ProductFormData & { id: string };
    mode: "create" | "edit";
}

export function ProductForm({ initialData, mode }: ProductFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<ProductFormData>({
        name: initialData?.name || "",
        sku: initialData?.sku || "",
        brand: initialData?.brand || "",
        category: initialData?.category || "",
        basePrice: initialData?.basePrice || 0,
        description: initialData?.description || "",
        status: initialData?.status || "active",
    });

    const createMutation = useCreateProduct();
    const updateMutation = useUpdateProduct();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === "create") {
            createMutation.mutate(formData, {
                onSuccess: (data) => {
                    router.push(`/products/${data.id}`);
                },
            });
        } else {
            updateMutation.mutate(
                { id: initialData!.id, ...formData },
                {
                    onSuccess: () => {
                        router.push(`/products/${initialData?.id}`);
                    },
                },
            );
        }
    };

    const mutation = mode === "create" ? createMutation : updateMutation;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Product Name <span className="text-red-600">*</span>
                        </Label>
                        <Input
                            id="name"
                            required
                            placeholder="e.g., Jameson Irish Whiskey 750ml"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sku">
                            SKU <span className="text-red-600">*</span>
                        </Label>
                        <Input
                            id="sku"
                            required
                            placeholder="e.g., JAM-IW-750"
                            value={formData.sku}
                            onChange={(e) =>
                                setFormData({ ...formData, sku: e.target.value })
                            }
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="brand">Brand</Label>
                            <Input
                                id="brand"
                                placeholder="e.g., Jameson"
                                value={formData.brand}
                                onChange={(e) =>
                                    setFormData({ ...formData, brand: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, category: value })
                                }
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="whiskey">Whiskey</SelectItem>
                                    <SelectItem value="vodka">Vodka</SelectItem>
                                    <SelectItem value="gin">Gin</SelectItem>
                                    <SelectItem value="beer">Beer</SelectItem>
                                    <SelectItem value="wine">Wine</SelectItem>
                                    <SelectItem value="rum">Rum</SelectItem>
                                    <SelectItem value="cognac">Cognac</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="basePrice">
                            Base Price (KES) <span className="text-red-600">*</span>
                        </Label>
                        <Input
                            id="basePrice"
                            type="number"
                            required
                            min="0"
                            step="1"
                            placeholder="1500"
                            value={formData.basePrice || ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    basePrice: Number.parseFloat(e.target.value),
                                })
                            }
                        />
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Retail selling price before any discounts
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Optional product description"
                            rows={3}
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                        />
                    </div>

                    {mode === "edit" && (
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value: "active" | "inactive") =>
                                    setFormData({ ...formData, status: value })
                                }
                            >
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending
                        ? mode === "create"
                            ? "Creating..."
                            : "Saving..."
                        : mode === "create"
                            ? "Create Product"
                            : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}
