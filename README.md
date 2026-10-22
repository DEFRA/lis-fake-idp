# lis-fake-idp

Part of the Livestock Information Service (LIS), which lets livestock keepers, owners, agents and
delegates record and manage their animals.

`lis-fake-idp` is a fake OpenID Connect (OIDC) identity provider. It stands in for Defra Customer
Identity (used by the front-office hub) and Entra ID (used by the back-office hub) in the local
lis-dev stack and in some CDP environments, so sign-in works without live upstream coupling. It is
for non-production use only. See [Deployment and environments](#deployment-and-environments).

Deployed on the Core Delivery Platform (CDP). See the
[CDP portal service page](https://portal.cdp-int.defra.cloud/services/lis-fake-idp) for
environments, deployments, logs and metrics.

## Architecture

```text
hub (front-office or back-office) → OIDC discovery, authorize, token, JWKS → this app
```

One server mounts one self-contained OIDC provider per faked identity provider:

| Mount path  | Fakes                                          | Used by          | Users from                    |
| ----------- | ---------------------------------------------- | ---------------- | ----------------------------- |
| `/defra-ci` | Defra Customer Identity (front-office sign-in) | front-office hub | `data/fixtures/defra-ci.json` |
| `/entra-id` | Entra ID (back-office sign-in)                 | back-office hub  | `data/fixtures/entra-id.json` |

- Authentication: none. Every route is open, by design. The provider hands out tokens for the
  fixture users to any client that knows the client id and secret.
- Downstream calls: none. The app makes no outbound calls.
- State: each provider generates an RSA key pair at startup and signs tokens with RS256, so tokens
  issued before a restart no longer verify afterwards. Authorization codes are held in memory and
  are single use, with a 10 minute lifetime.
- Shared packages: none. The app is standalone (hapi, Nunjucks and GOV.UK Frontend).

The code is in `src/server/oidc-fake`. `createOidcFakePlugin` builds a provider from a name, a
label, a mount path, a fixture file, base URLs and client credentials. `src/server/defra-ci` and
`src/server/entra-id` each call it once, and `src/server/router.js` registers them.

See [HUB-ARCHITECTURE.md](https://github.com/DEFRA/lis-dev/blob/main/HUB-ARCHITECTURE.md) for the
hub and spoke design.

### Routes

Paths for each provider are relative to its mount path (`/defra-ci` or `/entra-id`).

| Method | Path                                | Purpose                                                                                            |
| ------ | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| GET    | `/.well-known/openid-configuration` | Discovery document                                                                                 |
| GET    | `/jwks`                             | Public signing key (JWKS)                                                                          |
| GET    | `/authorize`                        | Authorization endpoint. Shows the user picker, or redirects straight back if already signed in     |
| POST   | `/authorize`                        | Receives the picker choice and redirects to `redirect_uri` with `code` and `state`                 |
| POST   | `/token`                            | Token endpoint. Exchanges a code (with PKCE) for an `id_token` and `access_token`                  |
| GET    | `/logout`                           | End-session endpoint. Clears the fake sign-in and redirects to `post_logout_redirect_uri` if given |

Outside the providers:

| Method | Path             | Purpose                                       |
| ------ | ---------------- | --------------------------------------------- |
| GET    | `/health`        | Health check, returns `{"message":"success"}` |
| GET    | `/public/{path}` | Static assets for the picker page             |

There is no userinfo endpoint. The user's claims are in the ID token.

### How the fake behaves

- **Authorization code flow with PKCE.** `/authorize` takes `state`, `nonce`, `redirect_uri`,
  `code_challenge` and `code_challenge_method`. `/token` only supports `grant_type=authorization_code`,
  and checks the `S256` code verifier. `redirect_uri` is not validated against a list, so any value is
  accepted.
- **Client authentication.** `/token` requires the provider's client id and secret, sent as HTTP Basic
  or in the form body (`client_secret_basic`, `client_secret_post`). Anything else gets
  `invalid_client`.
- **User picker.** `/authorize` shows a GOV.UK radios page listing every user in the provider's
  fixture. The chosen user is remembered in a cookie scoped to that provider's mount path
  (`oidc-fake-session-defra-ci` or `oidc-fake-session-entra-id`), so later sign-ins skip the picker.
- **`prompt` handling.** `prompt=login` and `prompt=select_account` always show the picker.
  `prompt=none` signs the remembered user in without showing a page. With no remembered user it
  redirects back with `error=login_required`, and combined with `select_account` it redirects back
  with `interaction_required`.
- **Tokens.** The ID token carries `iss`, `sub`, `aud` (the client id), `iat`, `exp` (one hour),
  `nonce`, `name`, `firstName`, `lastName`, `email` and `roles`. The access token carries only `iss`,
  `sub`, `aud`, `iat` and `exp`. The `email` claim is the fixture key.
- **Issuer and endpoints.** The discovery document's `issuer`, `token_endpoint` and `jwks_uri` use the
  internal base URL, which is what the hub's server calls. `authorization_endpoint` and
  `end_session_endpoint` use the external base URL, which is what the user's browser follows. The
  external base falls back to the internal one when unset.

### Fixture users

Each provider reads one JSON file in `data/fixtures` at startup. The object key is the sign-in email.

```json
{
  "joe.helpdesk@defra.gov.uk": {
    "sub": "4e5d3b4d-5f5f-4fcb-a0e4-5d9a8d3b6f5a",
    "name": "Joe Helpdesk",
    "roles": ["bcms_user"],
    "description": "Standard back-office user"
  }
}
```

| Field                   | Used for                                                             |
| ----------------------- | -------------------------------------------------------------------- |
| key                     | The `email` claim, and the value posted by the picker                |
| `sub`                   | The `sub` claim. Use a unique, stable UUID                           |
| `name`                  | The `name` claim, and the label in the picker                        |
| `firstName`, `lastName` | Claims of the same name (the Defra CI fixture sets them)             |
| `roles`                 | The `roles` claim (the Entra ID fixture sets them). Defaults to `[]` |
| `description`           | Hint text under the user in the picker                               |

To add a user, add an entry to the right fixture file and restart the app (fixtures are read once at
startup, and nodemon only watches `src`, so it does not restart for changes in `data`). The first user in the file is
preselected in the picker. Check the hub's access rules for the `sub` or `email` you add, because the
hub and the permissions service decide what a user can see, not this app.

To fake another provider, add a fixture, create `src/server/<name>/index.js` that calls
`createOidcFakePlugin`, add its settings to `src/config/config.js`, and register it in
`src/server/router.js`.

## Prerequisites

- Node.js 24 (see `.nvmrc`, use `nvm use`)
- Docker with Docker Compose
- A local clone of [lis-dev](https://github.com/DEFRA/lis-dev) (recommended, see [Running with lis-dev](#running-with-lis-dev-recommended))

## Setup

### Development

```bash
nvm use
npm install
```

There is no `.env` file or `.env.example`. Every setting has a working default for running on its
own, and lis-dev sets the rest in compose. See [Configuration](#configuration).

### Test

There are no tools to install beyond `npm install`. Tests use [Vitest](https://vitest.dev/).

## Running with lis-dev (recommended)

The fake identity provider only matters alongside the hubs. [lis-dev](https://github.com/DEFRA/lis-dev)
runs the hubs and this app locally with Docker Compose and serves them behind local HTTPS hostnames,
so it is the recommended way to run and work on this repo. Follow its README for the one-time setup
(hosts file and TLS certificates).

Start the stack:

```bash
cd lis-dev
docker compose up -d
```

In compose this app is the `lis-fake-idp` service, listening on port 3000. To work on it, swap its
container for a local server with hot reload while the rest of the stack stays in Docker:

```bash
.bin/sideload up fake/idp
.bin/sideload restore    # when done: back to the container
```

Locally the two providers are reached at:

| URL                                        | Used for                                                   |
| ------------------------------------------ | ---------------------------------------------------------- |
| `https://mock-defra-ci.lis.defra/defra-ci` | Browser redirects for front-office sign-in (external base) |
| `https://mock-entra-id.lis.defra/entra-id` | Browser redirects for back-office sign-in (external base)  |
| `http://fake-idp.lis.defra:3000/defra-ci`  | Hub server calls: discovery, token, JWKS (internal base)   |
| `http://fake-idp.lis.defra:3000/entra-id`  | Hub server calls: discovery, token, JWKS (internal base)   |

Caddy serves the two `mock-` hostnames and forwards them to this app. Then open
<https://front-office.lis.defra> or <https://back-office.lis.defra> and choose a user in the picker.

## Running standalone

You can also run the server on its own with `npm run dev`. It listens on port 3000 and serves both
providers with the default settings, for example
<http://localhost:3000/defra-ci/.well-known/openid-configuration>. Nothing here depends on other
services, but the picker is only reached when a client starts an authorization request.

| Script        | Purpose                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| `npm run dev` | Watch-build frontend assets and run the server with nodemon, in parallel |
| `npm start`   | Production build and start                                               |

### Configuration

Configuration is in `src/config/config.js`. The client secrets are marked secret. All settings have
defaults, so nothing is required.

| Variable                 | Description                                                                                                                          | Default                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| `HOST`                   | Address to bind                                                                                                                      | `0.0.0.0`                               |
| `PORT`                   | Port to bind                                                                                                                         | `3000`                                  |
| `ASSET_PATH`             | Asset path prefix                                                                                                                    | `/public`                               |
| `STATIC_CACHE_TIMEOUT`   | Static asset cache TTL (ms)                                                                                                          | `604800000`                             |
| `LOG_ENABLED`            | Whether logging is on                                                                                                                | `true` (`false` in tests)               |
| `LOG_LEVEL`              | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent`                                                                       | `info`                                  |
| `LOG_FORMAT`             | `ecs` or `pino-pretty`                                                                                                               | `ecs` in production, else `pino-pretty` |
| `DEFRA_CI_EXTERNAL_BASE` | Browser-visible base URL of the Defra CI fake, used for the authorization and end-session endpoints. Falls back to the internal base | none                                    |
| `DEFRA_CI_INTERNAL_BASE` | Server-to-server base URL of the Defra CI fake: the issuer, token and JWKS endpoints                                                 | `http://localhost:3000/defra-ci`        |
| `DEFRA_CI_CLIENT_ID`     | Client id the Defra CI fake accepts at the token endpoint                                                                            | `front-office-client`                   |
| `DEFRA_CI_CLIENT_SECRET` | Secret. Client secret the Defra CI fake requires at the token endpoint                                                               | `front-office-client-secret`            |
| `ENTRA_ID_EXTERNAL_BASE` | Browser-visible base URL of the Entra ID fake. Falls back to the internal base                                                       | none                                    |
| `ENTRA_ID_INTERNAL_BASE` | Server-to-server base URL of the Entra ID fake                                                                                       | `http://localhost:3000/entra-id`        |
| `ENTRA_ID_CLIENT_ID`     | Client id the Entra ID fake accepts at the token endpoint                                                                            | `back-office-client`                    |
| `ENTRA_ID_CLIENT_SECRET` | Secret. Client secret the Entra ID fake requires at the token endpoint                                                               | `back-office-client-secret`             |

The default client secrets are public placeholders that match the lis-dev hubs. The
`cdp/app-config` files for this service do not set them (see below), so unless they are set as secrets
in the CDP portal the defaults apply there too.

## Deployment and environments

This service is for non-production use. It issues tokens for anyone who asks, with no real
authentication, so it must not be used to protect real data.

The CDP configuration in `cdp/app-config` sets, in `dev`, `test`, `ext-test` and `perf-test`:

- `DEFRA_CI_INTERNAL_BASE` and `ENTRA_ID_INTERNAL_BASE` to `https://lis-fake-idp.<env>.cdp-int.defra.cloud/<provider>`
- `ENTRA_ID_CLIENT_ID` to the back-office app registration id, and `DEFRA_CI_CLIENT_ID` to `front-office-client`

The `infra-dev`, `management` and `prod` environments set no values for this service.

In those CDP environments the back-office hub sets `OIDC_DISCOVERY_URL_FAKE` to this service's
`/entra-id` discovery URL, alongside `OIDC_DISCOVERY_URL`, which points at the real Entra ID tenant.
The front-office hub's `OIDC_DISCOVERY_URL` points at the real Defra Customer Identity in every
environment, so front-office sign-in does not use this service on CDP.

## Running tests

```bash
npm test                 # builds the frontend, runs unit tests with coverage; fails below 90% lines
npm run lint             # ESLint and Stylelint
npm run format:check     # Prettier
```

End-to-end journeys are covered by [lis-journey-tests](https://github.com/DEFRA/lis-journey-tests).

## Monitoring

- Health check: `GET /health`
- Logs: OpenSearch dashboard per environment, linked from the [CDP portal service page](https://portal.cdp-int.defra.cloud/services/lis-fake-idp) under Logs
- Metrics: Grafana dashboard per environment, linked from the [CDP portal service page](https://portal.cdp-int.defra.cloud/services/lis-fake-idp) under Metrics

## Pipelines

Build, versioning and publishing run in GitHub Actions (`.github/workflows`) using Cake scripts (`*.cake`):

- **Pull request to `main`**: validate (format, lint, test), Sonar analysis, version check
- **Push to a `feature/` or `hotfix/` branch**: prerelease build and tag
- **Merge to `main`**: release tag, then publish the container image to CDP

Versions come from git tags (SemVer).

## Branching policy

The repo uses mainline development. Branch from `main` and name the branch:

- `feature/LREG-<ticket>-<short-kebab-description>`
- `hotfix/LREG-<ticket>-<short-kebab-description>`

`LREG` must be uppercase, because the GitHub ruleset rejects other branch names. Rebase onto `main`
rather than merging `main` in. Incomplete work goes behind a feature flag.

## Contributing to this project

- Follow the [Defra software development standards](https://github.com/DEFRA/software-development-standards).
- A pre-commit hook (`.husky/pre-commit`) runs the security audit, format check, lint and tests. `npm install` installs it through the `prepare` script.
- Open a pull request against `main` using the PR template. CI must pass and the Sonar quality gate must be green before merge.

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government licence v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of His Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
