import { type RouteConfig, index, route } from "@react-router/dev/routes";

// PHASE 1A TEST: Only static pages (no auth, no loaders)

export default [
	index("routes/hello.tsx"),
	route("/about", "routes/about.tsx"),
	route("/home", "routes/home.tsx"),
	route("/wikimedia", "routes/wikimedia.tsx"),
] satisfies RouteConfig;
