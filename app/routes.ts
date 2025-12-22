import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Register the app pages and API routes. 
export default [
	index("routes/home.tsx"),
	route("/about", "routes/about.tsx"),
	// Brainparts pages
	route("/brainparts", "routes/brainparts.tsx"),
	route("/brainparts/create", "routes/brainparts/create.tsx"),
	route("/brainparts/update", "routes/brainparts/update.tsx"),
	// Sequences pages
	route("/sequences/:id", "routes/sequence.tsx"),
	// Brainparts API
	route("/api/brainparts", "routes/api/brainparts-drizzle.js"),
	// Sequences API
	route("/api/sequences", "routes/api/sequences.js"),
] satisfies RouteConfig;
