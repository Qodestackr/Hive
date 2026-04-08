/**
 * New Product Page
 */

import { ProductForm } from "@/components/features/products/product-form";

export default function NewProductPage() {
    return (
        <div className="space-y-6 p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Add New Product
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Create a new product in your catalog
                </p>
            </div>

            <ProductForm mode="create" />
        </div>
    );
}
