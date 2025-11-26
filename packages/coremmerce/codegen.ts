import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
	overwrite: true,
	schema: `${"https://store-dvup9a9c.saleor.cloud/"}graphql/`,
	documents: "src/graphql/**/*.graphql",
	generates: {
		"src/gql/": {
			preset: "client",
			plugins: [],
		},
		"./graphql.schema.json": {
			plugins: ["introspection"],
		},
	},
};

export default config;
