export async function tryCatch<T, E = Error>(
	promise: Promise<T>,
): Promise<{ data: T; error: null } | { data: null; error: E }> {
	try {
		const data = await promise;
		return { data, error: null };
	} catch (error) {
		return { data: null, error: error as E };
	}
}
