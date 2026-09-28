# Security model

This project is free-play only.

- Virtual coins have no cash value.
- Deposit, withdrawal, payout, UPI and bank-transfer functionality are disabled.
- Production passwords should be stored as strong hashes.
- Admin routes require authentication and role-based access control.
- Authentication and game APIs should be rate-limited.
- Validate all client input on the server.
- Keep audit logs for administrative actions.
- Never trust client-side balances or results.
