declare const process: {
	env: {
		NODE_ENV?: "development" | "production" | string;
		[key: string]: string | undefined;
	};
};
