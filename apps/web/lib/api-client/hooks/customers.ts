import { customers } from "../domains/customers";
import { createMutation, createQuery } from "../factories";

export const useCustomers = createQuery("customers", customers.list);
export const useCustomer = createQuery("customer", customers.get);
export const useCustomerStats = createQuery("customer-stats", customers.stats);

export const useCreateCustomer = createMutation(customers.create, {
    invalidateKeys: ["customers"],
});

export const useUpdateCustomer = createMutation(customers.update, {
    invalidateKeys: ["customers", "customer"],
});

export const useDeleteCustomer = createMutation(customers.delete, {
    invalidateKeys: ["customers"],
});

export const useVerifyAge = createMutation(customers.verifyAge, {
    invalidateKeys: ["customer"],
});

export const useOptIn = createMutation(customers.optIn, {
    invalidateKeys: ["customer"],
});

export const useOptOut = createMutation(customers.optOut, {
    invalidateKeys: ["customer"],
});

export const useBulkImportCustomers = createMutation(customers.bulkImport, {
    invalidateKeys: ["customers"],
});
