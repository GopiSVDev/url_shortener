import { useRouteLoaderData } from "react-router";
import type { loader } from "~/root";

export function useRootData() {
  const data = useRouteLoaderData<typeof loader>("root");
  if (!data) throw new Error("Root loader data is unavailable");
  return data;
}
