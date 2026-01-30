import { type RouteConfig, index, route } from "@react-router/dev/routes";

// PHASE 1B TEST: Adding auth routes one by one

export default [
	index("routes/hello.tsx"),
	route("/about", "routes/about.tsx"),
	route("/home", "routes/home.tsx"),
	route("/wikimedia", "routes/wikimedia.tsx"),
	// Test auth routes individually
	route("/login", "routes/login.tsx"),
	route("/logout", "routes/logout.tsx"),
] satisfies RouteConfig;
