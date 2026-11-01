# Demo code and teaching-flow review

Review completed after aligning the React UI, Express API, PowerPoint deck, and live-demo runbooks.

## Corrections made

### Role-aware UI and authorization lab

The original finished UI showed every protected-action button, while the presentation described hiding controls according to role. The UI now has two explicit sections:

- **Your role-aware workspace** shows only controls relevant to the current role.
- **Teaching lab** intentionally calls every protected route and displays `401`, `403`, or `200`.

This demonstrates the trust boundary without disabling middleware during class.

### Visible status codes

The React API helper now preserves HTTP status codes in an `ApiError`. Demo messages display the status and server message, making the difference between `401` and `403` observable.

### Real password input

The login form now contains a password field. The teacher can demonstrate both a generic failed-login response and a successful bcrypt comparison.

### Guest-session privacy

The internal `guestId` remains server-side and is removed from purchase responses. Public responses expose only `checkoutType: "guest"` or `checkoutType: "account"`.

### Guest email validation

Guest checkout validates the email before creating an anonymous session. This remains deliberately minimal; production code should use schema validation.

### Stable demo password hash

The classroom password uses a pre-generated bcrypt hash, mirroring a database record. The server no longer recalculates the same hash at startup.

### Safer lecture workflow

The runbooks no longer instruct the teacher to remove authorization middleware. Students predict the result, use the Teaching lab to make a direct API request, and then inspect the middleware that produced it.

### Local-development cookie explanation

The Finnish runbook explicitly explains that local HTTP development uses `cinema-session` without `Secure`, while the production HTTPS configuration uses `__Host-cinema-session` with `Secure`.

## Verification

- Seven API tests pass.
- The React production build succeeds.
- Guest, customer, cashier, owner, logout, generic login failure, and cookie behavior have automated coverage.
- The 21-slide PowerPoint and all Word documents pass Office ZIP-structure validation.

## Deliberate classroom limitations

- Data and sessions are stored in memory.
- Seat availability and double-booking are not implemented.
- Payment is simulated.
- CSRF defenses are discussed but not implemented as a complete production design.
- Roles copied into a session may become stale; production must define role refresh or session invalidation behavior.
- Input validation is intentionally small and must be replaced with schema validation in production.
