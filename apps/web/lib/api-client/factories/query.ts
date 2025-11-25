/**
 * React Query factory for uniform query hook creation
 * Provides consistent interface for all data-fetching hooks
 */

import { useQuery, type UseQueryOptions, type QueryKey } from "@tanstack/react-query";

// Type helper to extract data from openapi-fetch response
type ApiResponse<T> = T extends Promise<infer R> ? R : never;
type ApiData<T> = ApiResponse<T> extends { data?: infer D } ? D : never;
type ApiError<T> = ApiResponse<T> extends { error?: infer E } ? E : never;

/**
 * Create a typed React Query hook from an API function
 * 
 * @example
 * ```ts
 * export const useCampaigns = createQuery(
 *   'campaigns',
 *   campaigns.list
 * );
 * 
 * // Usage in component:
 * const { data, isLoading } = useCampaigns({ status: 'active' });
 * ```
 */
export function createQuery<
    TQueryKey extends string,
    TQueryFn extends (...args: any[]) => Promise<any>
>(
    queryKey: TQueryKey,
    queryFn: TQueryFn
) {
    return (
        ...args: Parameters<TQueryFn>
    ) => {
        type ResponseData = ApiData<ReturnType<TQueryFn>>;
        type ResponseError = ApiError<ReturnType<TQueryFn>>;

        return useQuery<ResponseData, ResponseError>({
            queryKey: [queryKey, ...args] as QueryKey,
            queryFn: async () => {
                const response = await queryFn(...args);

                // openapi-fetch returns { data, error, response }
                if (response.error) {
                    throw response.error;
                }

                return response.data as ResponseData;
            },
            staleTime: 60_000, // 1 minute default
        });
    };
}

/**
 * Create a typed React Query hook with custom options
 * Allows overriding default behavior per query
 */
export function createQueryWithOptions<
    TQueryKey extends string,
    TQueryFn extends (...args: any[]) => Promise<any>
>(
    queryKey: TQueryKey,
    queryFn: TQueryFn,
    defaultOptions?: Partial<UseQueryOptions>
) {
    return (
        ...args: Parameters<TQueryFn>
    ) => {
        type ResponseData = ApiData<ReturnType<TQueryFn>>;
        type ResponseError = ApiError<ReturnType<TQueryFn>>;

        return useQuery<ResponseData, ResponseError>({
            queryKey: [queryKey, ...args] as QueryKey,
            queryFn: async () => {
                const response = await queryFn(...args);

                if (response.error) {
                    throw response.error;
                }

                return response.data as ResponseData;
            },
            staleTime: 60_000,
            ...defaultOptions,
        });
    };
}
