# Cloudflare Pages Deployment

## Purpose

R0-WP0.7 proves that Unicorn Valley is a conventional static Vite build that can be hosted by Cloudflare Pages without server-side runtime dependencies.

The repository-side smoke test is automated in CI and the production project is connected through the Cloudflare Pages GitHub integration.

## Production verification record

R0 deployment verification completed on 17 August 2026.

- Production URL: `https://unicorn-valley.pages.dev/`
- Production branch: `main`
- Verified deployed commit: `780726dd93b1ec03b2bd706f67b8b53e684b6f5b`
- GitHub Actions `Validate` check: passed
- Cloudflare Pages check: passed, reported `Deployed successfully`
- Repository static-host smoke test: passed for the same build path and asset conventions

This establishes the R0 deployment gate. The browser checks below remain the regression checklist for later releases.

## Cloudflare Pages project settings

Use these settings for the Git-connected Pages project:

- Repository: `tametheboardgame/unicorn-valley`
- Production branch: `main`
- Root directory: repository root
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: `22.23.2`, pinned by the repository `.node-version` file
- Environment variables: none required for the R0 build
- Production deployments: enabled for `main`
- Preview deployments: enabled for non-production branches where practical

Cloudflare documents `npm run build` and `dist` for Vite-based Pages deployments and supports `.node-version` for selecting the Pages build Node.js version.

References:

- https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/
- https://developers.cloudflare.com/pages/configuration/build-image/
- https://developers.cloudflare.com/pages/get-started/git-integration/

## Asset-path policy

Vite is configured with an explicit root base path (`/`). Production assets are therefore expected under root-relative `/assets/...` URLs on the Pages hostname.

Game code that refers to public Vite assets should use `import.meta.env.BASE_URL` when constructing runtime URLs. This avoids embedding an unrelated development host or filesystem path.

The checked-in static smoke test inspects the generated `dist/index.html`, verifies that every root-relative referenced file exists in `dist`, then serves `dist` through a temporary local HTTP server and verifies the document and generated assets return successful HTTP responses.

## Automated smoke check

Run:

```sh
npm run build
npm run smoke:static
```

`npm run validate` also includes the production build and static smoke test.

CI performs the same verification on pushes and pull requests.

## Production deployment regression checklist

After Cloudflare reports a successful production deployment from `main`:

1. Open the production `*.pages.dev` URL in a normal browser.
2. Confirm the page title is `Unicorn Valley` and the Phaser scene renders.
3. Open browser developer tools and confirm there are no failed JavaScript, CSS or favicon requests.
4. Confirm the generated JavaScript and CSS requests load from the same Pages hostname under `/assets/`.
5. Hard-refresh the production root URL and confirm the game renders again.
6. Open the production URL with `?scene=resize-test` and confirm the responsive canvas diagnostic renders.
7. Resize the browser through wide, tall and small shapes and confirm the logical game world remains undistorted.
8. Press Escape in the resize diagnostic and confirm the named `BACK` input returns to the title scene.
9. On the title scene, confirm keyboard interaction and pointer/touch interaction still produce the same acknowledgement.
10. Confirm the Cloudflare production deployment is associated with the expected `main` commit.

## Failure handling

If the production deployment fails:

- verify Cloudflare is building the repository root;
- verify the production branch is `main`;
- verify the build command is `npm run build`;
- verify the output directory is `dist`;
- verify the Pages build honours `.node-version` and reports Node.js `22.23.2`;
- inspect failed `/assets/` requests for an incorrect base path;
- reproduce locally with `npm run validate` before changing Cloudflare-specific settings.

Do not add Cloudflare Functions, Workers, redirects or runtime bindings merely to make the static foundation deploy. R0 intentionally requires a plain static build.
