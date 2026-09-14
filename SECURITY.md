# Security

## Supported deployment

Budget Planner is designed as a single-user, local-only service. It binds to `127.0.0.1` by default.
Do not expose port 3012 directly to a LAN or the internet. Remote access requires an authenticated
HTTPS reverse proxy and a separate security review.

Financial data and exported backups are stored as readable JSON. Protect the host account, disk,
data directory, and backup files using appropriate operating-system access controls and encryption.

## Reporting a vulnerability

Report suspected vulnerabilities privately to the distributor. Include the affected version,
reproduction steps, impact, and any suggested mitigation. Do not include real financial data.

## Release checks

Run `npm ci`, `npm run quality`, and `npm run build` from a clean checkout. Releases must not proceed
with high or critical dependency findings.
