# Security model

This project is free-play only.

- Virtual coins have no cash value.
- Deposit, withdrawal, payout, UPI and bank-transfer functionality are disabled.
- This build uses guest cookie sessions; if credentialed accounts are added, passwords must use a modern password hash (Argon2id/scrypt/bcrypt) and recovery tokens must be single-use and expiring.
- Session cookies are HttpOnly and SameSite=Lax; production adds Secure.
- Admin actions are token-protected and audited; full RBAC/2FA remains a deployment hardening step.
- Admin routes require authentication and role-based access control.
- Authentication and game APIs should be rate-limited.
- Do not expose ADMIN_TOKEN in client code, logs, or committed files.
- Production deployments should terminate TLS at the edge and keep the SQLite volume persistent.
- Validate all client input on the server.
- Keep audit logs for administrative actions.
- Never trust client-side balances or results.
