/** Frontend hooks for retrieving the authenticated user's profile from the Remix backend. */
import axios from "axios";
import { useQuery } from "react-query";
import type { AuthUser } from "~/utils/backend/auth/types";

/**
 * React Query hook that fetches the authenticated user's profile from `/api/auth/me`.
 *
 * Returns `{ data, isLoading, ... }`. Does not retry on failure (a 401/etc. means
 * the user is not authenticated, and re-trying would just spam the endpoint).
 */
export function useMeProfile() {
  return useQuery(
    ["profile", "me"],
    () => axios.get<AuthUser>(`/api/auth/me`).then((r) => r.data),
    {
      retry: false,
    }
  );
}
