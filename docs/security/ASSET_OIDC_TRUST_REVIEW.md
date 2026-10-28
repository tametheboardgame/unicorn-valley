# Generated asset pipeline: OIDC trust-boundary review

Status: GitHub workflow hardening proposed in PR, **Google Cloud IAM not yet independently verified or changed**.

## Intended access boundary

- GitHub repository: `tametheboardgame/unicorn-valley`
- Immutable GitHub repository ID: `1336804131`
- GitHub account owner ID: `8076321`
- Workflow: `.github/workflows/generated-asset-materialisation.yml`
- Allowed run trigger: manually dispatched `workflow_dispatch` **from `refs/heads/main`** only
- Requested destination: an existing, validated `agent/*` development branch
- Google provider: Configured repository variable GCP_WORKLOAD_IDENTITY_PROVIDER
- The trusted workflow, import script and allowed output policy are loaded from `main`; the target branch supplies a manifest and receives a WebP.
- The Google Drive API scope requested by the importer is `drive.readonly`, subject to the service account's actual ACLs.

## Google Cloud review required (do not change existing IAM blindly)

1. In Google Cloud console > IAM & Admin > Workload Identity Federation, open the provider configured for this repository.
2. Confirm issuer `https://token.actions.githubusercontent.com` and a provider **attribute condition** restricting to this **immutable repository ID** (not only a username). For example, assuming claims are available:
   `assertion.repository_id == '1336804131' && assertion.repository_owner_id == '8076321' && assertion.ref == 'refs/heads/main' && assertion.event_name == 'workflow_dispatch'`
   Where supported, also restrict to `assertion.workflow_ref == 'tametheboardgame/unicorn-valley/.github/workflows/generated-asset-materialisation.yml@refs/heads/main'`.
3. Verify the matching service-account `roles/iam.workloadIdentityUser` binding is scoped to this repository identity only; avoid pooled owner-wide grants.
4. Verify the service account's Google Drive sharing is limited to the approved **staging folder** and the contents needed for import. Check inherited/shared-drive access; `drive.readonly` prevents writes but not reads to other content the identity can access.
5. Review all other Google Cloud IAM roles on the service account; remove unnecessary project-editor, storage-admin or broad roles.
6. Require a human-reviewed PR for any subsequent change to the trusted workflow or the trusted import script/config. Do **not** enable privileged automatic `agent/*` push jobs.
7. After the workflow is merged and IAM is restricted, dispatch from **main** with a safe test manifest and a safe `agent/*` branch. Confirm an image is committed to that branch only. Then test a malicious-looking manifest path and target branch; both must fail **before** OIDC authentication.
8. Check GitHub Actions history for older workflow revisions still running from other refs. Enforce the Google IAM condition above to block OIDC for them even if users can dispatch an outdated workflow on a non-main branch.

Do not include service account keys or access tokens in this document. Review **non-secret configuration metadata only**.
Reference: https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines
