# Authentication and authorization in a cinema web application

Suggested duration: 90 minutes. The headings can be used directly as slides.

## 1. The business situation

Aurora Cinema needs one application for three roles:

- a customer browses movies, reserves seats, and buys tickets
- a cashier assists customers and sees sales tools
- an owner sees business reports and manages staff access

A customer may also buy a ticket without creating an account. Authentication must therefore be optional for checkout, while authorization remains mandatory for protected actions.

## 2. Learning objectives

After the session, you can:

- distinguish authentication from authorization
- describe a browser login using a server session and cookie
- protect an Express route by login state and role
- explain why hiding UI elements is not authorization
- distinguish `401` from `403`
- explain what JWT is and why this application teaches an opaque session cookie
- identify which parts of the demo must change before production

## 3. Two questions

**Authentication asks: Who are you?**

Examples: password login, passkey, or identity provider login.

**Authorization asks: Are you allowed to do this?**

Examples: a customer may read their own purchases; a cashier may use sales tools; only an owner may read an owner report.

Authentication normally happens first. Authorization must still be checked separately for every protected operation.

## 4. The trust boundary

Everything from the browser can be modified:

- React state
- hidden buttons
- request bodies
- route URLs
- user IDs and prices sent by the client

The server is the enforcement point. React may improve usability by showing relevant controls, but it cannot grant permission.

## 5. Password login flow

```text
React                     Express                    User store
  | POST email+password      |                           |
  |------------------------->| find user                 |
  |                          |-------------------------->|
  |                          | compare password hash     |
  |                          | regenerate session        |
  | Set-Cookie: random id    |                           |
  |<-------------------------|                           |
  | GET /api/auth/me + cookie|                           |
  |------------------------->|                           |
  | user without password    |                           |
  |<-------------------------|                           |
```

The password is hashed, not encrypted. The application compares the submitted password with the stored hash. It never returns a password or hash to React.

## 6. The session cookie

The browser stores only an unpredictable identifier:

```http
Set-Cookie: __Host-cinema-session=random-value; HttpOnly; Secure; SameSite=Lax; Path=/
```

- `HttpOnly`: browser JavaScript cannot read the credential
- `Secure`: send it only through HTTPS
- `SameSite=Lax`: limits cross-site sending and helps reduce CSRF risk
- `Path=/`: cookie applies throughout the application
- `__Host-`: requires secure, host-only cookie settings

The server session store maps the random identifier to current server-side state, such as `userId` and role.

## 7. Guest checkout uses a session but not authentication

A guest can receive an anonymous session or checkout identifier. It can refer to a cart or temporary seat hold, but it does not prove identity.

```text
guest session → cart + seat hold + expiration
user session  → user ID + cart + account purchases
```

If the guest signs in, the application may safely merge the guest cart into the account. A completed guest order can be retrieved using an unguessable order reference plus an appropriate verification step.

## 8. Authorization middleware

```js
app.get("/api/my-purchases", requireAuthentication, handler);
app.get("/api/cashier/sales", requireRole("cashier", "owner"), handler);
app.get("/api/owner/report", requireRole("owner"), handler);
```

Roles are a starting point. Object-level authorization is also required:

```js
purchase.userId === req.session.user.id
```

Without that ownership check, one customer might read another customer's purchase by changing an ID.

## 9. Status codes

- `401 Unauthorized`: the server cannot identify an authenticated user; sign in is required
- `403 Forbidden`: the server knows the user, but that user lacks permission
- `404 Not Found`: sometimes used instead of `403` when revealing that a protected resource exists would leak information

## 10. JWT in five minutes

JWT means JSON Web Token. A common signed JWT has three Base64URL-encoded parts:

```text
header.payload.signature
```

The payload may contain claims such as subject (`sub`), issuer (`iss`), audience (`aud`), and expiry (`exp`). A signature detects modification. It does **not** normally encrypt the payload.

JWT answers neither of these questions by itself:

- Where is the token stored in the browser?
- How is it transported to the API?

Common patterns include:

1. JWT in an `Authorization: Bearer` header. Browser code must obtain and hold it.
2. JWT in an HTTP-only cookie. JavaScript cannot read it, but cookie and CSRF considerations apply.
3. A backend-for-frontend holds service tokens while the browser receives only a session cookie.

JWT can be useful for mobile clients, external API consumers, identity protocols, or independently operated services. It also introduces expiry, refresh, key rotation, validation, and revocation decisions. Claims such as roles can become stale until a token expires.

## 11. Why this course example does not teach JWT implementation

For one React browser client and one Express backend:

- a server session is easier to revoke
- current roles remain on the server
- guest and signed-in flows share one model
- no bearer credential needs to be exposed to React
- fewer moving parts make authorization easier to see

JWT is allowed in student projects, but the team must justify it and safely design storage, transport, expiry, refresh, revocation, CSRF/XSS protections, and role changes.

## 12. Attacks to recognize

- **Credential stuffing:** rate limit login and support stronger authentication
- **Session fixation:** regenerate the session after login
- **Session theft:** HTTPS, secure cookie settings, XSS prevention, short appropriate lifetime
- **CSRF:** SameSite, origin checks, and CSRF tokens where required
- **Broken access control:** authorize on every server operation and test negative cases
- **User enumeration:** use a generic login failure response

## 13. Payments are a separate trust problem

The server must calculate the price, create an expiring seat hold, and confirm payment using a verified payment-provider webhook. A browser redirect or “payment successful” screen is not proof of payment. Make webhook processing idempotent and never store card details in the cinema application.

## 14. Summary

1. Authentication identifies a user.
2. Authorization permits an action.
3. React communicates state; Express enforces access.
4. Guest checkout has a session but no authenticated identity.
5. JWT is a token format, not the opposite of a cookie.
6. This browser application uses an opaque ID in an HTTP-only cookie because it is the simplest suitable design.
