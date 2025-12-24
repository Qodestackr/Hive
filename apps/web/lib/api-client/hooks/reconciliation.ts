import { reconciliation } from "../domains/reconciliation";
import { createMutation } from "../factories";

export const useReconcileProduct = createMutation(reconciliation.product);
export const useReconcileOrganization = createMutation(reconciliation.organization);
export const useCorrectDiscrepancy = createMutation(reconciliation.correct);
