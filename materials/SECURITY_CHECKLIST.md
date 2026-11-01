# Authentication and authorization checklist

Use this during project reviews. A checked box should be supported by code or a test.

## Authentication

- [ ] Passwords are hashed with a password-hashing algorithm, never stored in plaintext.
- [ ] Login failure does not reveal whether the email exists.
- [ ] Login attempts are rate limited.
- [ ] The session ID changes after login.
- [ ] Logout invalidates the server session.
- [ ] Account recovery is designed as carefully as login.
- [ ] No credential or password hash is returned to React.

## Browser session

- [ ] Production uses HTTPS everywhere.
- [ ] The authentication cookie is `HttpOnly` and `Secure`.
- [ ] `SameSite` is explicitly selected and understood.
- [ ] Cookie scope is as narrow as practical.
- [ ] Sessions have appropriate idle and absolute expiry.
- [ ] Production sessions are stored outside application memory.
- [ ] CSRF protection matches the deployment and request types.
- [ ] Authentication tokens are not stored in `localStorage`.

## Authorization

- [ ] Every protected API operation checks authorization on the server.
- [ ] UI visibility is treated only as a usability feature.
- [ ] Both role and resource ownership are checked where needed.
- [ ] IDs from the browser are treated as untrusted input.
- [ ] Denied cases have automated tests.
- [ ] Staff account suspension and role removal take effect promptly.
- [ ] Sensitive actions are logged without logging secrets.

## Guest checkout and tickets

- [ ] A guest identifier is not treated as authenticated identity.
- [ ] Guest references are unpredictable and expire appropriately.
- [ ] Seat holds expire and are protected against double booking.
- [ ] Prices are calculated and verified on the server.
- [ ] Payment is confirmed from a verified provider webhook.
- [ ] Payment/webhook handling is idempotent.
- [ ] Card details are handled by the payment provider, not this application.

## If the team chooses JWT

- [ ] The architecture has a documented reason for JWT.
- [ ] Tokens are not assumed to be encrypted.
- [ ] Signature algorithm, issuer, audience, expiry, and other claims are validated.
- [ ] Access-token lifetime is short and justified.
- [ ] Refresh-token storage, rotation, reuse detection, and revocation are designed.
- [ ] Logout and logout-from-all-devices behavior are defined.
- [ ] Role and account-status changes take effect within an acceptable time.
- [ ] XSS and CSRF risks match the actual token storage and transport mechanism.
