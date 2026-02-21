// Catch-all route for unmatched paths (like Chrome DevTools requests)
export async function loader() {
  return new Response(null, { status: 404 });
}

export default function CatchAll() {
  return null;
}
