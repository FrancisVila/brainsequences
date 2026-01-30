import { type RouteConfig, index, route } from "@react-router/dev/routes";

// PHASE 1 TEST: Adding back simple static and auth routes
// Testing which routes cause the Vercel deployment issue

export default [
	index("routes/hello.tsx"),
	// Static pages
	route("/about", "routes/about.tsx"),
	route("/home", "routes/home.tsx"),
	route("/wikimedia", "routes/wikimedia.tsx"),
	// Authentication pages (no complex imports)
	route("/login", "routes/login.tsx"),
	route("/signup", "routes/signup.tsx"),
	route("/logout", "routes/logout.tsx"),
] satisfies RouteConfig;
