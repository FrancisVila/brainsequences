import { type RouteConfig, index, route } from "@react-router/dev/routes";

// PHASE 1C TEST: Adding signup route

export default [
	index("routes/hello.tsx"),
	route("/about", "routes/about.tsx"),
	route("/home", "routes/home.tsx"),
	route("/wikimedia", "routes/wikimedia.tsx"),
	route("/login", "routes/login.tsx"),
	route("/signup", "routes/signup.tsx"),
	route("/logout", "routes/logout.tsx"),
] satisfies RouteConfig;
