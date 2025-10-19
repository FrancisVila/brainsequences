import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Register the app pages and API routes. The API handler at
// `app/routes/api/notes.js` should be exposed at `/api/notes`.
export default [
	index("routes/home.tsx"),
	route("/api/notes", "routes/api/notes.js"),
] satisfies RouteConfig;
