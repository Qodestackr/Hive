import { logger, type BetterAuthPlugin } from "better-auth";
import {
	APIError,
	createAuthEndpoint,
	sessionMiddleware,
} from "better-auth/api";
import { z } from "@repo/utils";
import { tryCatch } from "@repo/utils";

export const reverify = () => {
	return {
		id: "reverify",
		endpoints: {
			reverifyPassword: createAuthEndpoint(
				"/reverify/password",
				{
					method: "POST",
					use: [sessionMiddleware],
					body: z.object({
						password: z.string(),
					}),
				},
				async (ctx) => {
					const session = ctx.context.session;

					const { data: validPassword, error } = await tryCatch(
						ctx.context.password.checkPassword(session.user.id, ctx),
					);

					if (error) {
						logger.error(
							`[Promco: Reverify] Error checking password`,
							error,
						);
						if (
							error instanceof APIError &&
							error?.body?.code === "INVALID_PASSWORD"
						) {
							logger.info(`[Promco: Reverify] Password is invalid`);
							return ctx.json({ valid: false, newSession: null });
						}
						throw new APIError("INTERNAL_SERVER_ERROR", {
							message: "Something went wrong while checking the password revfy",
						});
					}

					return ctx.json({ valid: validPassword });
				},
			),
		},
	} satisfies BetterAuthPlugin;
};
