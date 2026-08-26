# Cloudflare Pages Deployment

## Purpose

Unicorn Valley is a conventional static Vite build hosted by Cloudflare Pages without server-side runtime dependencies.

The repository-side deployment checks are automated in CI and the production project is connected through the Cloudflare Pages GitHub integration.

## Production verification record

R0 deployment verification completed on 17 August 2026.

- Production URL: `https://unicorn-valley.pages.dev/`
- Production branch: `main`
- Verified deployed commit: `780726dd93b1ec03b2bd706f67b8b53e684b6f5b`
- GitHub Actions `Validate` check: passed
- Cloudflare Pages check: passed, reported `Deployed successfully`
- Repository static-host smoke test: passed for the same build path and asset conventions

R6-WP6.9 adds the final browser/deployment hardening gate. Its exact-head preview and post-merge production verification are recorded in `07D-R6-IMPLEMENTATION-LOG.md` when the package closes.

## Cloudflare Pages project settings

Use these settings for the Git-connected Pages project:

- Repository: `tametheboardgame/unicorn-valley`
- Production branch: `main`
- Root directory: repository root
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: `22.23.2`, pinned by the repository `.node-version` file
- Environment variables: none required by the static build
- Production deployments: enabled for `main`
- Preview deployments: enabled for non-production branches

Cloudflare Pages Git integration automatically creates branch/PR previews and reports deployment status back to GitHub. Current Cloudflare documentation also supports a static `_headers` file in `public/`, which Vite copies into `dist` for Pages to parse.

References:

- https://developers.cloudflare.com/pages/configuration/git-integration/
- https://developers.cloudflare.com/pages/configuration/headers/
- https://developers.cloudflare.com/pages/configuration/serving-pages/

## Asset-path and cache policy

Vite is configured with an explicit root base path (`/`). Production assets are therefore expected under root-relative `/assets/...` URLs on the Pages hostname.

Game code that refers to public Vite assets should use `import.meta.env.BASE_URL` when constructing runtime URLs. This avoids embedding an unrelated development host or filesystem path.

Vite fingerprints generated JavaScript and CSS filenames. `public/_headers` therefore applies the following browser-cache policy:

- `/` and `/index.html`: `Cache-Control: no-cache`, so the HTML shell revalidates and can discover a new deployment immediately;
- `/assets/*`: `Cache-Control: public, max-age=31536000, immutable`, so content-addressed JavaScript/CSS can remain cached safely until its filename changes.

Do not apply immutable long-lived caching to the HTML shell.

The checked-in static smoke test verifies that:

- `dist/index.html` has the expected title;
- generated `/assets/` JavaScript/CSS references are fingerprinted;
- every root-relative referenced file exists in `dist`;
- the built `_headers` file contains the required HTML and asset cache rules;
- the document, resize diagnostic URL and generated assets return successful responses from a temporary local production-output server.

## Automated checks

Run the standard repository gate:

```sh
npm run validate
```

For the full Chromium regression suite:

```sh
npm run test:play
```

For the bounded R6 browser-family compatibility matrix:

```sh
npm run test:browser-compat
```

The compatibility matrix intentionally tests browser engines rather than pretending Linux CI is a branded-device lab:

- Chromium desktop, representing the Chrome/Edge engine family;
- Firefox desktop;
- WebKit desktop, representing the Safari engine family where accessible in automation;
- Chromium and WebKit at representative 1024×768 tablet touch viewports;
- Chromium and WebKit at representative 390×844 phone touch viewports.

Each compatibility run checks production-output boot, responsive canvas fit, same-origin fingerprinted assets, reload stability, console errors, uncaught page errors, failed requests and HTTP error responses.

CI keeps the complete gameplay regression suite on Chromium and runs the smaller compatibility matrix separately across Chromium, Firefox and WebKit.

## Preview deployment regression checklist

For every release-hardening PR:

1. Confirm the Cloudflare Pages preview check is attached to the exact PR head commit.
2. Confirm Cloudflare reports the preview deployment successful.
3. Confirm the preview is not a production-branch deployment.
4. Confirm repository `Validate`, full Chromium browser playtest and browser compatibility jobs pass on the same executable head.
5. Treat a new commit after those checks as invalidating the prior evidence and repeat the exact-head checks.

## Production deployment regression checklist

After Cloudflare reports a successful production deployment from `main`:

1. Confirm the production deployment is associated with the expected merged `main` commit.
2. Open the production `*.pages.dev` URL in a normal browser and confirm the page title is `Unicorn Valley` and the Phaser scene renders.
3. Confirm there are no failed JavaScript, CSS or favicon requests and no unexpected console/page errors.
4. Confirm generated JavaScript and CSS load from the same Pages hostname under fingerprinted `/assets/` paths.
5. Reload and hard-refresh the production root URL and confirm the game renders again.
6. Confirm the HTML response is revalidated rather than held immutably by the browser.
7. Confirm fingerprinted `/assets/*` responses receive the immutable one-year browser-cache policy.
8. Open the production URL with `?scene=resize-test` and confirm the responsive canvas diagnostic renders.
9. Resize through wide, tall and small shapes and confirm the logical game world remains undistorted.
10. On a touch-capable phone/tablet browser where available, confirm the production build remains usable and the canvas stays inside the viewport.

## Failure handling

If a production or preview deployment fails:

- verify Cloudflare is building the repository root;
- verify the production branch is `main`;
- verify the build command is `npm run build`;
- verify the output directory is `dist`;
- verify the Pages build honours `.node-version` and reports Node.js `22.23.2`;
- inspect failed `/assets/` requests for an incorrect base path;
- verify `dist/_headers` exists and contains the expected cache rules;
- reproduce repository-side failures with `npm run validate` and the relevant Playwright command before changing Cloudflare-specific settings.

Do not add Cloudflare Functions, Workers, redirects or runtime bindings merely to deploy the static game. The current architecture intentionally remains a plain static Pages build.
