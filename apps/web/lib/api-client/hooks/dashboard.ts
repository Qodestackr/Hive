import { dashboard } from "../domains/dashboard";
import { createQuery } from "../factories";

export const useDashboardOverview = createQuery("dashboard-overview", dashboard.overview);
