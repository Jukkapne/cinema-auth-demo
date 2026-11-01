# Live-coding guide

The repository is the finished state. To create suspense, begin from a prepared branch or temporarily comment out the middleware on the protected routes. Do not type visual styling during class.

## Part 1 — Establish the two checkout paths (5 minutes)

1. Start the application without signing in.
2. Book seat C7 as a guest.
3. Sign in as the customer and book the seat again.
4. Inspect the two purchase objects: one has `guestEmail`, the other has `userId`.

Teaching point: a session can support a guest journey without authenticating a person.

## Part 2 — Inspect the login (8 minutes)

Open `server/src/app.js` at `POST /api/auth/login`.

1. Normalize the email.
2. find the user
3. compare the submitted password with the hash
4. use one generic error message
5. regenerate the session
6. store only the safe user object

In browser storage tools, find `cinema-session`. Show that its value is not visible to application JavaScript because it is HTTP-only. In the Network panel, show the `Set-Cookie` response and the cookie on the next request.

## Part 3 — Recover login state after refresh (4 minutes)

Open the React `useEffect` and `GET /api/auth/me`. Refresh the page. Explain that React state disappears, while the browser cookie allows Express to recognize the session. React receives a public user object, not the credential.

## Part 4 — Demonstrate the broken version (5 minutes)

Temporarily remove `requireRole("owner")` from `/api/owner/report`, or show a prepared commit without it.

1. Sign in as the customer.
2. Hide the owner button in React based on the role.
3. Call `/api/owner/report` using the Network panel, an API client, or the temporarily visible demo button.
4. Observe that the secret data is returned.

Teaching point: presentation logic is not a security boundary.

## Part 5 — Add authentication middleware (5 minutes)

Implement or reveal:

```js
export function requireAuthentication(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Please sign in first." });
  }
  next();
}
```

Apply it to `/api/my-purchases`. Test signed out and signed in.

## Part 6 — Add role middleware (8 minutes)

Implement or reveal `requireRole(...allowedRoles)` and apply it:

```js
app.get("/api/cashier/sales", requireRole("cashier", "owner"), handler);
app.get("/api/owner/report", requireRole("owner"), handler);
```

Run this matrix:

| User | My purchases | Cashier sales | Owner report |
|---|---:|---:|---:|
| Guest | 401 | 401 | 401 |
| Customer | 200 | 403 | 403 |
| Cashier | 200 | 200 | 403 |
| Owner | 200 | 200 | 200 |

The cashier and owner receive `200` for “my purchases” because that route requires only authentication. In a real domain, decide whether staff accounts should also behave as customers.

## Part 7 — Show a resource ownership check (4 minutes)

Point to the filter in `/api/my-purchases`:

```js
purchases.filter((purchase) => purchase.userId === req.session.user.id)
```

Explain that role checks alone are insufficient. A customer must not read another customer's order by changing `/purchases/123` to `/purchases/124`.

## Part 8 — Logout (3 minutes)

Show that logout destroys the server session and clears the cookie. Return to `/api/auth/me` and a protected route.

## Part 9 — JWT comparison (5 minutes)

Do not implement JWT. Draw its three parts and explain:

```text
header.payload.signature
```

Compare an opaque cookie session with a bearer JWT. Ask where the JWT would be stored, how it would be refreshed and revoked, and how a changed cashier role would take effect. Conclude with the course decision: opaque ID in an HTTP-only cookie.

## Part 10 — Verify with tests (3 minutes)

Run `npm test`. Point out that good authorization tests include denied cases, not only successful cases.

## Optional challenge demonstration

In React, change the displayed role or force an owner button to appear. The server must still return `403`. This is a memorable final proof that the server owns authorization.
