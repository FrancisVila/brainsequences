import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Register the app pages and API routes. The API handler at
// `app/routes/api/notes.js` should be exposed at `/api/notes`.
export default [
	index("routes/home.tsx"),
	route("/api/notes", "routes/api/notes-drizzle.js"),
	// Brainparts pages
	route("/brainparts", "routes/brainparts.tsx"),
	route("/brainparts/create", "routes/brainparts/create.tsx"),
	route("/brainparts/update", "routes/brainparts/update.tsx"),
	// Brainparts API
	route("/api/brainparts", "routes/api/brainparts-drizzle.js"),
] satisfies RouteConfig;
