# Exercises

## Exercise 1 — Predict the response

For each request, predict `200`, `401`, or `403` before running it.

1. A guest requests `/api/my-purchases`.
2. A customer requests `/api/owner/report`.
3. A cashier requests `/api/cashier/sales`.
4. An owner requests `/api/owner/report`.

## Exercise 2 — Add an owner-only user list

Create `GET /api/owner/users`. It must:

- require the `owner` role
- return public user objects only
- never return `passwordHash`
- have one successful and two denied tests

## Exercise 3 — Add object-level authorization

Create `GET /api/purchases/:id`.

- a customer may read only their own purchase
- a cashier and owner may read any purchase
- a guest may not read an account purchase
- use `404` if the purchase does not exist

Explain why checking only `role === "customer"` would be insufficient.

## Exercise 4 — Improve guest checkout

Validate the guest email and create an expiring guest checkout identifier. Decide what happens when a guest signs in midway through checkout. Write the decision down before coding it.

## Exercise 5 — Security review

Find at least five deliberate production gaps in this repository. For each one, state:

- the risk
- a production replacement
- how you would verify the replacement

## Optional exercise — JWT design, not implementation

If your team wants to use JWT, submit a one-page design answering:

1. Why is JWT useful in your architecture?
2. Where are access and refresh tokens stored?
3. Which clients can read them?
4. How short is the access-token lifetime?
5. How are refresh tokens rotated and revoked?
6. How does logout from all devices work?
7. How does a role removal take effect?
8. What are your XSS and CSRF controls?
9. Which issuer, audience, signature algorithm, and claims are validated?
10. Why is the design safer or more useful than a server session for your case?

## Answer guide

### Exercise 1

1. `401`: no authenticated identity
2. `403`: authenticated but not an owner
3. `200`: cashier is an allowed role
4. `200`: owner is an allowed role

### Exercise 2

Use `requireRole("owner")` and map through `publicUser`. Test a guest (`401`), customer (`403`), and owner (`200`). Assert that the JSON text does not contain `passwordHash`.

### Exercise 3

First locate the purchase. Then allow staff roles or require `purchase.userId === req.session.user.id`. Test both another customer's ID and the user's own ID. Never trust a `userId` sent by the browser as proof of ownership.

### Exercise 4

A reasonable design stores a random checkout ID in a secure session cookie and the cart/hold on the server. On login, the server associates the current guest cart with the authenticated account after checking for conflicts and expired seat holds.

### Exercise 5

Examples include in-memory data, MemoryStore, hard-coded demo users, no database constraints, incomplete input validation, no real seat-locking transaction, no payment provider or verified webhook, incomplete CSRF design, no account recovery, and limited monitoring.
