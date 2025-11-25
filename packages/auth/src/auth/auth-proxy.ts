import { client } from "./auth-client";

export const authProxy = {
  api: {
    getSession: async ({ headers }: { headers: Headers }) => {
      const session = await client.getSession({
        fetchOptions: { headers, credentials: "include" },
      });
      if (session.error) throw new Error(session.error.message);
      return session.data;
    },
  },
};
