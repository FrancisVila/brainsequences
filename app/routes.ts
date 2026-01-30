import { type RouteConfig, index } from "@react-router/dev/routes";

// MINIMAL TEST CONFIGURATION FOR VERCEL DEPLOYMENT TROUBLESHOOTING
// Original routes backed up in routes.ts.backup
// If this deploys successfully, the issue is with specific routes
// If this fails, the issue is with dependencies in package.json

export default [
	index("routes/hello.tsx"),
] satisfies RouteConfig;
