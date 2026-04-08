/**
 * Edit Product Page
 */

"use client";

import { useProduct } from "@/lib/api-client";
import { ProductForm } from "@/components/features/products/product-form";
import { DetailPageSkeleton } from "@/components/ui/loading-skeleton";
import { notFound } from "next/navigation";

export default function EditProductPage({ params }: { params: { id: string } }) {
    const { data: product, isLoading } = useProduct(params.id);

    if (isLoading) {
        return (
            <div className="p-8">
                <DetailPageSkeleton />
            </div>
        );
    }

    if (!product) {
        return notFound();
    }

    return (
        <div className="space-y-6 p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Edit Product
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">{product.name}</p>
            </div>

            <ProductForm
                mode="edit"
                initialData={{
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    brand: product.brand || undefined,
                    category: product.category || undefined,
                    basePrice: product.basePrice,
                    description: product.description || undefined,
                    status: product.status,
                }}
            />
        </div>
    );
}
