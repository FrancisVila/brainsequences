I have an idea for troubleshooting the problem on vercel.
Does the problem come from the routes, or from the modules in the package.json file?
In routes.tsx and +routes.ts, routes are listed.
We can comment out all the routes and just create a hello world page for the root route (/) 
If this works on vercel, then it must be the routes.
If the error persists, then we can try the removing modules from the package.json.
