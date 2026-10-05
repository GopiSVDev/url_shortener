import { data } from "react-router";
import type { RouteHandle } from "~/components/layout/AppLayout";
import { NotFoundPage } from "~/components/NotFoundPage";

export const handle: RouteHandle = { title: "errors.notFoundTitle" };

// Catch-all route. Returning (not throwing) keeps the page inside the layout
// while still sending a real 404 status, so search engines don't index it.
export function loader() {
  return data(null, { status: 404 });
}

export default function NotFound() {
  return <NotFoundPage />;
}
