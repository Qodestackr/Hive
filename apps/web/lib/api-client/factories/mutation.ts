import {
	type UseMutationOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

// Type helpers for openapi-fetch responses
type ApiResponse<T> = T extends Promise<infer R> ? R : never;
type ApiData<T> = ApiResponse<T> extends { data?: infer D } ? D : never;
type ApiError<T> = ApiResponse<T> extends { error?: infer E } ? E : never;

/**
 * Create a typed React Query mutation hook from an API function
 *
 * @example
 * ```ts
 * export const useCreateCampaign = createMutation(
 *   campaigns.create,
 *   { invalidateKeys: ['campaigns'] }
 * );
 *
 * // Usage in component:
 * const { mutate, isPending } = useCreateCampaign();
 * mutate({ name: 'Flash Sale', ... });
 * ```
 */
export function createMutation<
	TMutationFn extends (...args: any[]) => Promise<any>,
>(
	mutationFn: TMutationFn,
	options?: {
		/** Query keys to invalidate on success */
		invalidateKeys?: string[];
		/** Custom success handler */
		onSuccess?: (
			data: ApiData<ReturnType<TMutationFn>>,
		) => void | Promise<void>;
		/** Custom error handler */
		onError?: (error: ApiError<ReturnType<TMutationFn>>) => void;
	},
) {
	return () => {
		const queryClient = useQueryClient();

		type ResponseData = ApiData<ReturnType<TMutationFn>>;
		type ResponseError = ApiError<ReturnType<TMutationFn>>;
		type Variables = Parameters<TMutationFn>;

		return useMutation<ResponseData, ResponseError, Variables>({
			mutationFn: async (...args: Variables) => {
				const response = await mutationFn(...args);

				if (response.error) {
					throw response.error;
				}

				return response.data as ResponseData;
			},
			onSuccess: async (data) => {
				// Invalidate related queries
				if (options?.invalidateKeys) {
					await Promise.all(
						options.invalidateKeys.map((key) =>
							queryClient.invalidateQueries({ queryKey: [key] }),
						),
					);
				}

				// Custom success handler
				if (options?.onSuccess) {
					await options.onSuccess(data);
				}
			},
			onError: options?.onError,
		});
	};
}

/**
 * Create mutation with full custom options support
 */
export function createMutationWithOptions<
	TMutationFn extends (...args: any[]) => Promise<any>,
>(mutationFn: TMutationFn, defaultOptions?: Partial<UseMutationOptions>) {
	return (customOptions?: Partial<UseMutationOptions>) => {
		const queryClient = useQueryClient();

		type ResponseData = ApiData<ReturnType<TMutationFn>>;
		type ResponseError = ApiError<ReturnType<TMutationFn>>;
		type Variables = Parameters<TMutationFn>;

		return useMutation<ResponseData, ResponseError, Variables>({
			mutationFn: async (...args: Variables) => {
				const response = await mutationFn(...args);

				if (response.error) {
					throw response.error;
				}

				return response.data as ResponseData;
			},
			...defaultOptions,
			...customOptions,
		});
	};
}
