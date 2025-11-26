export function getInitials(name?: string, max = 3): string {
	if (!name) return "U";

	const words = name.trim().split(/\s+/).filter(Boolean); // remove empty strings

	if (words.length === 0) return "U";

	if (words.length === 1) {
		// Single word → first character safely
		return (words[0]?.[0] ?? "U").toUpperCase();
	}

	// Take up to `max` words, get first char of each safely
	return words
		.slice(0, max)
		.map((word) => (word?.[0] ?? "U").toUpperCase())
		.join("");
}
