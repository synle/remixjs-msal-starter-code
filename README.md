# Remix SSO Starter (Microsoft + Google)

A minimal Remix v1 + MUI app demonstrating cookie-based SSO sign-in via
**Microsoft / Azure AD** and **Google**, with a normalized user shape, signed
state cookies for login-CSRF protection, and a pluggable provider registry so
you can add more IdPs without touching the routes.

## Features

- Two configured providers out of the box: `microsoft`, `google`
- Pluggable `AuthProvider` interface (`app/utils/backend/auth/types.ts`) — add
  a new provider by writing one file and registering it
- Pre-auth state cookie + nonce check (login CSRF protection, replay prevention)
- Normalized `AuthUser` shape stored in the session cookie — frontend never
  has to branch on which provider issued the identity
- Vitest test suite covering normalization, OAuth URL building, state
  signing/validation, and redirect URI resolution

## Requirements

- Node 18+ (Node 20 recommended)
- An Azure AD app registration (for Microsoft login) and/or a Google Cloud
  OAuth client (for Google login). You only need to configure the providers
  you plan to use; the unused one will fail closed at runtime.

## Quick start

```bash
npm install
cp .env.bak .env   # then fill in the values, see "Environment" below
npm run dev
```

Open <http://localhost:3000>. You should see two buttons: **Log in with
Microsoft** and **Log in with Google**.

### Debugging in VS Code

`.vscode/launch.json` ships with five one-click launch configs (Run and
Debug panel, or `F5`):

- **Remix Dev Server** — `npm run dev` with the JS debugger attached
- **Remix Production Server (built)** — `npm start` with `NODE_ENV=production`
- **Vitest: Run All Tests**
- **Vitest: Debug Current Test File** — uses `${relativeFile}`
- **Vitest: Coverage**

## Environment

The app reads its configuration from `process.env`. In dev, the easiest path
is a `.env` file at the repo root; in production, set them on the host (Azure
App Service "Configuration", GitHub Actions secrets, etc.).

### Session

| Var              | Required        | Purpose                                                                                                                          |
| ---------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `SESSION_SECRET` | Production: yes | Secret used to sign the `__session` and `__auth_state` cookies. Use a random 32+ byte string. Required in `NODE_ENV=production`. |
| `NODE_ENV`       | yes             | Set to `production` on the deployed host so secure cookies + hard-fail on missing secret kick in.                                |

If `SESSION_SECRET` is not set, the app falls back to `AAD_SSO_CLIENT_VALUE`
(legacy) and finally to a known-bad literal `"s3cret1"` — the literal is
**only** allowed outside production.

### Microsoft / Azure AD

| Var                      | Required | Purpose                                                                                               |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------------------- |
| `AAD_SSO_CLIENT_ID`      | yes      | App registration (client) id from Azure Portal → Azure AD → App registrations → your app → Overview.  |
| `AAD_SSO_CLIENT_VALUE`   | yes      | Client secret value from your app's "Certificates & secrets" tab.                                     |
| `AAD_SSO_TENANT_ID`      | no       | Tenant guid. Defaults to `common` (multi-tenant + personal MS accounts).                              |
| `MICROSOFT_REDIRECT_URL` | no       | Full URL (incl. callback path) to use as `redirect_uri`. Overrides every other resolution rule below. |
| `AAD_REDIRECT_URL`       | no       | Legacy alias for `MICROSOFT_REDIRECT_URL`. Kept for back-compat.                                      |

**Where to register the redirect URI in Azure:**

1. Azure Portal → Azure AD → App registrations → your app → **Authentication**
2. Under **Web → Redirect URIs**, add:
   - `http://localhost:3000/api/auth/microsoft/login_callback` (dev)
   - `https://<your-prod-host>/api/auth/microsoft/login_callback` (prod)
3. Make sure **ID tokens** is checked (or at least Access tokens, depending on
   what your app needs — this starter uses access tokens only).

### Google

| Var                          | Required | Purpose                                                                        |
| ---------------------------- | -------- | ------------------------------------------------------------------------------ |
| `GOOGLE_OAUTH_CLIENT_ID`     | yes      | OAuth 2.0 Client ID from Google Cloud Console → APIs & Services → Credentials. |
| `GOOGLE_OAUTH_CLIENT_SECRET` | yes      | Matching client secret.                                                        |
| `GOOGLE_REDIRECT_URL`        | no       | Full URL to use as `redirect_uri`. Overrides the request-based resolution.     |

**Where to register the redirect URI in Google Cloud:**

1. Google Cloud Console → **APIs & Services → Credentials**
2. Either **Create credentials → OAuth client ID** (type: Web application) or
   edit your existing one
3. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/auth/google/login_callback` (dev)
   - `https://<your-prod-host>/api/auth/google/login_callback` (prod)
4. Under **OAuth consent screen**, set the app to **External** if you want any
   Google account to be able to sign in (otherwise restrict to a workspace).

### Redirect URI resolution

For each provider, the redirect URI used at `/authorize` (and replayed at
`/token`) is resolved in this order:

1. Per-provider env: `MICROSOFT_REDIRECT_URL` / `GOOGLE_REDIRECT_URL`
2. (microsoft only) `AAD_REDIRECT_URL`
3. `AUTH_BASE_HOST_URL` or `AAD_SSO_BASE_HOST_URL` + the conventional callback path
4. The request's own host (`https://` everywhere except `localhost`)

Any IdP enforces an exact match against its registered list, so `(4)` is a
nice dev-time fallback but you should pin `(1)` or `(3)` in prod.

## Routes

| URL                                  | Method   | What it does                                                              |
| ------------------------------------ | -------- | ------------------------------------------------------------------------- |
| `/api/auth/:provider/login`          | GET      | Begin OAuth flow for `:provider` (e.g. `microsoft`, `google`).            |
| `/api/auth/:provider/login_callback` | GET/POST | OAuth callback. POST for AAD (`response_mode=form_post`), GET for Google. |
| `/api/auth/login`                    | GET      | Back-compat shim → redirects to `/api/auth/microsoft/login`.              |
| `/api/auth/me`                       | GET      | Returns the normalized `AuthUser` from the session cookie, or 401.        |
| `/api/auth/logout`                   | GET      | Destroys the session cookie and redirects home.                           |

## Adding a new provider

1. Create `app/utils/backend/auth/<provider>.ts` exporting an `AuthProvider`.
2. Add its id to the `AuthProviderId` union in `app/utils/backend/auth/types.ts`.
3. Register it in `app/utils/backend/auth/registry.ts`.
4. Add a redirect-env-key entry in `app/utils/backend/auth/redirectUri.ts`.
5. Add a "Log in with X" button in `app/root.tsx` pointing at `/api/auth/<provider>/login`.

No route code changes are required — the dynamic `:provider` segment dispatches.

## Scripts

| Command             | What it does                                      |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Run the Remix dev server on http://localhost:3000 |
| `npm run build`     | Build the production bundle into `build/`         |
| `npm start`         | Serve the production bundle (`remix-serve build`) |
| `npm test`          | Run vitest in watch mode (interactive)            |
| `npm run test-ci`   | Run vitest once with coverage (used by CI)        |
| `npm run coverage`  | Same as `test-ci` — alias                         |
| `npm run typecheck` | Run TypeScript without emitting                   |
| `npm run format`    | Run oxfmt across the repo                        |

## Deployment

Deploys to **Azure App Service (Linux, Node)** via
[`.github/workflows/deploy-azure.yml`](.github/workflows/deploy-azure.yml).
App Service rather than Azure Functions because a Remix server is a long-lived
Node HTTP process; Functions would need a custom handler shim and lose streaming.

#### One-time Azure setup

1. **Create the App Service**:

   ```bash
   az login
   az group create --name remix-sso-rg --location westus2
   az appservice plan create --name remix-sso-plan --resource-group remix-sso-rg --sku B1 --is-linux
   az webapp create --resource-group remix-sso-rg --plan remix-sso-plan \
     --name <your-app-name> --runtime "NODE:20-lts"
   ```

   Pick a globally-unique `<your-app-name>`; it becomes
   `https://<your-app-name>.azurewebsites.net`.

2. **Configure the startup command** (App Service runs `npm start` by default;
   we want the production bundle):

   ```bash
   az webapp config set --resource-group remix-sso-rg --name <your-app-name> \
     --startup-file "npm run start"
   ```

3. **Set environment variables** on the App Service (these become
   `process.env.*` at runtime):

   ```bash
   az webapp config appsettings set --resource-group remix-sso-rg --name <your-app-name> \
     --settings \
       NODE_ENV=production \
       SESSION_SECRET="$(openssl rand -base64 32)" \
       AAD_SSO_TENANT_ID=common \
       AAD_SSO_CLIENT_ID=<your-azure-app-client-id> \
       AAD_SSO_CLIENT_VALUE=<your-azure-app-client-secret> \
       GOOGLE_OAUTH_CLIENT_ID=<your-google-client-id> \
       GOOGLE_OAUTH_CLIENT_SECRET=<your-google-client-secret> \
       AUTH_BASE_HOST_URL=https://<your-app-name>.azurewebsites.net
   ```

4. **Register the production redirect URIs** with both IdPs — same steps as
   above, with `https://<your-app-name>.azurewebsites.net` as the host.

5. **Get a publish profile** for GitHub Actions:
   ```bash
   az webapp deployment list-publishing-profiles \
     --resource-group remix-sso-rg --name <your-app-name> --xml > publish-profile.xml
   ```
   Open `publish-profile.xml`, copy the **entire XML content**.

#### GitHub repo setup

The workflow scopes its secrets to a GitHub **Environment** named
`azure-production` so you can require manual approval before each deploy
(Settings → Environments → New environment → "Required reviewers"). Define
the secrets on that environment, not at the repo level:

| Secret                         | Value                                                       |
| ------------------------------ | ----------------------------------------------------------- |
| `AZURE_WEBAPP_NAME`            | The `<your-app-name>` you chose above.                      |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | The full XML contents of `publish-profile.xml` from step 5. |

The workflow at `.github/workflows/deploy-azure.yml` triggers on every push
to `main` and on manual `workflow_dispatch`. It runs `npm ci`,
`npm run test-ci`, `npm run build`, prunes dev deps, zips the artifact, and
deploys to the named App Service.

#### Rotating the publish profile

If you ever leak the publish profile (committed by accident, etc.), rotate it
in the Azure Portal: App Service → Deployment Center → **Manage publish
profile → Reset publish profile**, then update the `AZURE_WEBAPP_PUBLISH_PROFILE`
secret in GitHub with the new XML.

#### Verifying the deploy

After the workflow goes green, visit:

- `https://<your-app-name>.azurewebsites.net/api/auth/microsoft/login`
- `https://<your-app-name>.azurewebsites.net/api/auth/google/login`

Each should land you back at `/` with the user menu populated.
