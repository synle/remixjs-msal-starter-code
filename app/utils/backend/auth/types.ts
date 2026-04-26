/**
 * Identifier for the SSO provider that authenticated a user.
 *
 * Persisted alongside the user in the session cookie so the frontend can show
 * which provider issued the identity (e.g. "Signed in with Google"). Add new
 * providers by extending this union and registering them in the auth registry.
 */
export type AuthProviderId = "microsoft" | "google";

/**
 * Provider-agnostic profile of the currently authenticated user.
 *
 * Constructed by each provider's adapter from the raw upstream profile
 * (Microsoft Graph `/me`, Google `userinfo`, ...) and stored in the session
 * cookie. Frontend code should treat this as the canonical user shape and
 * never depend on raw provider fields.
 *
 * Note: this is intentionally separate from the legacy `User` type in
 * `~/types.d.ts`, which still describes the raw Microsoft Graph profile and
 * is kept for callers that need that shape directly.
 */
export type AuthUser = {
  /** Stable id from the upstream provider (`oid` / `id` / `sub`). */
  id: string;
  /** Lowercased email; the closest thing we have to a portable user key. */
  email: string;
  /** Human-readable display name for the user. */
  displayName: string;
  /** Provider that issued this identity. */
  provider: AuthProviderId;
};

/**
 * Inputs handed to a provider when redeeming the auth code.
 *
 * `formData` carries the full POST body for `responseMode=form_post` providers
 * (e.g. AAD). GET-callback providers pass `formData: undefined`.
 */
export type AuthenticateArgs = {
  code: string;
  redirectUri: string;
  formData?: URLSearchParams;
};

/**
 * Pluggable SSO provider adapter.
 *
 * Each adapter encapsulates the provider-specific bits:
 *   - Building the OAuth authorization URL
 *   - Redeeming the auth code and fetching the upstream profile
 *   - Normalizing that profile into the project-wide `AuthUser` shape
 *
 * Routes consume this interface only; they never branch on `id`. The only
 * thing routes need to know about a provider in advance is `callbackMode`,
 * because POST and GET callbacks dispatch differently in Remix.
 */
export type AuthProvider = {
  /** Stable id used in the URL: `/api/auth/:provider/...`. */
  id: AuthProviderId;
  /**
   * How the IdP returns the auth code.
   *   - `"get"`  - URL query string (Google's default)
   *   - `"post"` - form-encoded POST body (AAD with `response_mode=form_post`)
   */
  callbackMode: "get" | "post";
  /** Build the OAuth authorization URL the user is sent to. */
  buildAuthUrl(args: { redirectUri: string; state: string }): Promise<string>;
  /**
   * Redeem the auth code for tokens, fetch the upstream profile, and return
   * a normalized `AuthUser`. The implementation must NOT persist anything;
   * that is the route's responsibility.
   */
  authenticate(args: AuthenticateArgs): Promise<AuthUser>;
};
