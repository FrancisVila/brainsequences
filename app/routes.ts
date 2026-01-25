import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Register the app pages and API routes. 
export default [
	index("routes/home.tsx"),
	route("/about", "routes/about.tsx"),
	// Authentication
	route("/login", "routes/login.tsx"),
	route("/signup", "routes/signup.tsx"),
	route("/logout", "routes/logout.tsx"),
	// Brainparts pages
	route("/brainparts", "routes/brainparts.tsx"),
	route("/brainparts/create", "routes/brainparts/create.tsx"),
	route("/brainparts/update", "routes/brainparts/update.tsx"),
	// Sequences pages
	route("/sequences/new", "routes/sequences/new.tsx"),
	route("/sequences/:id/edit", "routes/sequences/edit.tsx"),
	route("/sequences/:id", "routes/sequence.tsx"),
	route("/sequences/:id/collaborators", "routes/sequences/$id.collaborators.tsx"),
	// Invitations
	route("/invitations/accept", "routes/invitations/accept.tsx"),
	// Admin
	route("/admin/users", "routes/admin/users.tsx"),
	// Wikimedia images
	route("/wikimedia", "routes/wikimedia.tsx"),
	// Brainparts API
	route("/api/brainparts", "routes/api/brainparts-drizzle.js"),
	// Sequences API
	route("/api/sequences", "routes/api/sequences.js"),
	// Steps API
	route("/api/steps", "routes/api/steps.js"),
] satisfies RouteConfig;
