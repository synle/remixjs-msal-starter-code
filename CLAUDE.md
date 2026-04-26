# CLAUDE.md

Guidance for Claude when working in this repo. Keep this file under ~200
lines so it stays load-bearing and not noise.

## Project shape (one-liner)

A Remix v1 starter app demonstrating cookie-based SSO via Microsoft and
Google, with a pluggable provider registry, a normalized `AuthUser` shape,
and signed pre-auth state cookies for login-CSRF protection. MUI on the
front end, vitest for tests, deploys to Azure App Service via GitHub
Actions.

## Where things live

- `app/utils/backend/auth/` — provider registry, `microsoft.ts`, `google.ts`,
  `state.ts` (signed pre-auth cookie), `redirectUri.ts`, shared `types.ts`.
- `app/utils/backend/Session.ts` — the `__session` cookie that holds the
  authenticated `AuthUser`.
- `app/routes/api.auth.$provider.login.ts` — start the OAuth flow.
- `app/routes/api.auth.$provider.login_callback.ts` — handles both GET (Google)
  and POST (AAD `form_post`) callbacks via `loader` + `action` exports.
- `app/routes/api.auth.login.ts` — back-compat redirect to the Microsoft path.
- `app/utils/frontend/hooks/Auth.tsx` — `useMeProfile` hook for the frontend.
- `.github/workflows/deploy-azure.yml` — CI/CD to Azure App Service.

## Conventions to follow

- **Adding a new SSO provider**: write one file at
  `app/utils/backend/auth/<id>.ts` exporting an `AuthProvider`; add the id to
  `AuthProviderId`; register in `registry.ts`; add the redirect-env-key entry
  in `redirectUri.ts`. Routes do not need to change.
- **Never branch on provider id in routes.** The whole point of the registry
  is that routes consume `AuthProvider` and let `callbackMode` drive POST vs
  GET dispatch.
- **Profile normalization happens in the provider adapter.** The session
  cookie holds `AuthUser`, never a raw upstream profile.
- **Pre-auth state is required.** Don't bypass `startAuthState` /
  `consumeAuthState` — they protect against login CSRF and pin the redirect
  URI server-side.
- **MSAL is lazily constructed.** `microsoft.ts` defers the
  `ConfidentialClientApplication` constructor so tests / Google-only deploys
  don't blow up at import time.
- **Tests live next to the code** as `*.spec.ts` — see `auth/google.spec.ts`
  for the axios-mocking pattern.

## GitHub Raw File URLs

When fetching raw file content from GitHub repos, always use
`raw.githubusercontent.com` (CORS-friendly):

`https://raw.githubusercontent.com/{owner}/{repo}/HEAD/{path}`

Do NOT use:

- `https://github.com/{owner}/{repo}/blob/HEAD/{path}?raw=1` (no CORS headers)
- `https://api.github.com/repos/{owner}/{repo}/contents/{path}` (returns JSON, not raw)

## Git / PR Merge Policy

- Always **squash and merge** PRs. Never merge commits or rebase merges.
- `git merge origin/main` locally is fine for syncing branches; the squash
  rule applies only to PR merges.

## Deployment (Azure App Service)

The repo ships a GitHub Actions workflow at
`.github/workflows/deploy-azure.yml` that builds and deploys to **Azure App
Service (Linux, Node 20)** on every push to `main`. We use App Service rather
than Azure Functions because Remix is a long-lived HTTP server.

### Required GitHub Actions secrets

| Secret                          | What it is                                                                |
| ------------------------------- | ------------------------------------------------------------------------- |
| `AZURE_WEBAPP_NAME`             | The app name (e.g. `remix-sso-starter`). Becomes `<name>.azurewebsites.net`. |
| `AZURE_WEBAPP_PUBLISH_PROFILE`  | Full XML from `az webapp deployment list-publishing-profiles --xml`.       |

### Required App Service environment variables

Set on the App Service itself (Configuration → Application settings), not in
GitHub. See README → "Azure deployment" for the full `az webapp config
appsettings set` invocation.

- `NODE_ENV=production` (required — switches on secure cookies + hard-fail
  on missing `SESSION_SECRET`)
- `SESSION_SECRET` (required — random 32+ byte string)
- `AAD_SSO_CLIENT_ID`, `AAD_SSO_CLIENT_VALUE`, optional `AAD_SSO_TENANT_ID`
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`
- `AUTH_BASE_HOST_URL=https://<your-app-name>.azurewebsites.net` (so the
  redirect URI sent to IdPs matches what's registered with them)

### Where to obtain each secret

- **Azure AD client id / secret**: Azure Portal → Azure AD → App registrations
  → your app → Overview (id) and Certificates & secrets (value).
- **Google OAuth client id / secret**: Google Cloud Console → APIs & Services
  → Credentials → your OAuth 2.0 Client ID.
- **Azure publish profile**:
  `az webapp deployment list-publishing-profiles --resource-group <rg> --name <app> --xml`.

### Redirect URIs to register on IdPs

Both IdPs enforce an exact-match check, so register the prod URLs **before**
the first deploy:

- Azure AD → Authentication → Web →
  `https://<your-app-name>.azurewebsites.net/api/auth/microsoft/login_callback`
- Google Cloud → Credentials → Authorized redirect URIs →
  `https://<your-app-name>.azurewebsites.net/api/auth/google/login_callback`
