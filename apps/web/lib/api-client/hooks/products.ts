import { products } from "../domains/products";
import { createMutation, createQuery } from "../factories";

export const useProducts = createQuery("products", products.list);
export const useProduct = createQuery("product", products.get);
export const useProductFIFOBatches = createQuery("product-fifo-batches", products.getFIFOBatches);

export const useCreateProduct = createMutation(products.create, {
    invalidateKeys: ["products"],
});

export const useUpdateProduct = createMutation(products.update, {
    invalidateKeys: ["products", "product"],
});

export const useDeleteProduct = createMutation(products.delete, {
    invalidateKeys: ["products"],
});

export const useUpdateProductPrice = createMutation(products.updatePrice, {
    invalidateKeys: ["products", "product"],
});

export const useBulkUpdatePrice = createMutation(products.bulkUpdatePrice, {
    invalidateKeys: ["products"],
});
