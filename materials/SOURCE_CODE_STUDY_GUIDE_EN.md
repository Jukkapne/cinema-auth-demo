# Cinema authentication demo: source-code study guide

This guide explains how authentication, server-side sessions, HTTP-only cookies, authorization, guest checkout, and ownership checks are implemented in the Aurora Cinema demo.

Use it together with these resources:

- Repository: [github.com/Jukkapne/cinema-auth-demo](https://github.com/Jukkapne/cinema-auth-demo)
- Interactive cookie-flow visualization: [http-only-cookie-flow.oamk-tietote-5786.chatgpt.site](https://http-only-cookie-flow.oamk-tietote-5786.chatgpt.site)
- Application source code in the repository

The guide concentrates on the most important code paths instead of explaining every line. Line numbers refer to the course version of the repository. If they change, search for the route or function name shown in the heading.

# Follow the interactive visualization alongside the source code

Open the interactive cookie-flow visualization on one screen and the repository in VS Code on the other. Use VS Code's global search (`Ctrl+Shift+F`) for `STEP 1`, then advance the visualization with **Next** and search for the matching `STEP 2`, `STEP 3`, and so on. Some steps have comments in more than one file. For an exact match, search `STEP 1 —` to avoid also matching `STEP 10`.

The visualization is conceptual; it is not the running application. Start the real application with `npm run dev`, sign in as the customer and use **Book seat C7 to my account** to observe actual requests in the browser's Network panel. Use a private window to start without an old cookie. Opening or advancing the visualization does not send requests to the application.

| Visualization | Search in the repository | What to follow |
|---|---|---|
| 1. React sends credentials | `STEP 1` in `client/src/main.jsx` | `login()` sends email and password to `/api/auth/login`. |
| 2. Express verifies password | `STEP 2` in `server/src/app.js` | User lookup and `bcrypt.compare()`. |
| 3. Server creates session | `STEP 3` in `server/src/app.js` | Session regeneration and `req.session.user`. |
| 4. Browser stores cookie | `STEP 4` in `server/src/app.js` | Session configuration; `express-session` creates the response header and the browser stores it. Inspect `Set-Cookie` in Network. |
| 5. React receives safe user data | `STEP 5` in `server/src/app.js`, `server/src/data.js`, and `client/src/main.jsx` | Password hash removed, public user returned, React state updated. |
| 6. Choose show and seats | `STEP 6` in `client/src/main.jsx` | The real demo selects a screening and hard-codes seat C7. |
| 7. Browser attaches cookie | `STEP 7` in `client/src/main.jsx` and `client/src/api.js` | Purchase request and same-origin credentials; the browser attaches the cookie. |
| 8. Express resolves session | `STEP 8` in `server/src/app.js` | `express-session` verifies the cookie and loads the session internally. |
| 9. Create booking | `STEP 9` in `server/src/app.js` | Validation, session-derived ownership and insertion into the in-memory array. |
| 10. Return result | `STEP 10` in `server/src/app.js` and `client/src/main.jsx` | `201` response and the message displayed by React. |

## Important differences between the visual and the actual code

- The visualization uses illustrative values, `/api/bookings`, `showId`, and seats A7/A8. The application uses `/api/purchases`, `screeningId`, and the fixed seat C7.
- The visualization depicts seat selection and a database. The application does not implement a seat-picker interface or a database: purchases are held in the `purchases` array and disappear when the server restarts.
- The visualization describes an authenticated booking authorization check. In this application `POST /api/purchases` also permits guests and does not enforce a customer role; the server uses `req.session.user` to associate an authenticated purchase with the user. Protected role checks are demonstrated separately by `/api/cashier/sales` and `/api/owner/report` in `server/src/app.js` and `requireRole` in `server/src/auth.js`.
- The demo records `demo-payment-pending`; it does not take payment, verify seat availability, prevent double bookings, or create a real seat hold.
- Local development uses HTTP and the cookie `cinema-session`. The visual describes HTTPS as a production scenario. A visitor may already have an anonymous guest session before login; login regenerates it.
- Session creation, signing, `Set-Cookie` and subsequent session lookup are performed by the `express-session` library. The numbered comments identify configuration and call sites; their internals are not implemented in this repository.
- The visualization site may require access permission. If the link is unavailable, ask your instructor for access and use the table above while reading the source.

# 1. Learning objectives

After studying the code, you should be able to:

1. trace a login request from React to Express and back
2. explain where a session and its cookie are created
3. explain why React never reads the HTTP-only session cookie
4. distinguish a guest session from an authenticated session
5. implement authentication and role middleware in Express
6. distinguish `401 Unauthorized` from `403 Forbidden`
7. explain why hiding a React button is not authorization
8. enforce both role and resource-ownership rules
9. explain how logout invalidates a server session
10. test both permitted and denied requests

# 2. Run the project

From the repository root:

```powershell
npm install
npm test
npm run dev
```

Open `http://localhost:5173`.

The demo accounts all use the classroom password `demo1234`:

| Role | Email |
|---|---|
| Customer | `customer@cinema.test` |
| Cashier | `cashier@cinema.test` |
| Owner | `owner@cinema.test` |

Open the browser developer tools and keep these views available:

- Network → Fetch/XHR
- Application or Storage → Cookies
- Console, if a request unexpectedly fails

Use a private browser window when you want to begin without an old session.

# 3. Source-code map

| File | Responsibility |
|---|---|
| `client/src/main.jsx` | React UI, public user state, and user actions |
| `client/src/api.js` | Shared fetch helper and HTTP error handling |
| `client/vite.config.js` | Development proxy for `/api` requests |
| `server/src/server.js` | Environment configuration and server startup |
| `server/src/app.js` | Session configuration, routes, login, purchases, and logout |
| `server/src/auth.js` | Authentication and role-authorization middleware |
| `server/src/data.js` | Classroom users, bcrypt hash, screenings, and in-memory data |
| `server/test/auth.test.js` | Security-behavior tests |

## The request pipeline

1. A React event handler calls `api()`.
2. The browser sends the HTTP request and automatically attaches a matching cookie.
3. During development, Vite proxies `/api` to Express.
4. `express-session` reads the cookie and resolves the server-side session.
5. Route middleware checks authentication and authorization.
6. The route handler performs the requested operation.
7. Express returns an HTTP response, usually containing JSON.
8. React updates the visible interface.

> Core principle: React guides the interface. The server makes the security decision.

# 4. The browser-side API helper

Open `client/src/api.js`.

```js
export async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(response.status, data.message ?? "The request failed.");
  }
  return data;
}
```

`api()` centralizes the common fetch configuration.

`credentials: "same-origin"` allows matching same-origin cookies to accompany a request. The browser adds the `Cookie` request header. React does not read the cookie value or construct the header manually.

The cookie is marked `HttpOnly`, so JavaScript cannot access its value through `document.cookie`. This reduces the risk of session-credential theft through injected JavaScript. It does not prevent XSS itself.

`ApiError` preserves the HTTP status returned by the server. The teaching interface can therefore display the difference between `401`, `403`, and other errors.

## Check your understanding

1. Search the React source for the value of `cinema-session`. Why is the session identifier not present?
2. Which component attaches the cookie to a request: React, fetch, or the browser's networking layer?
3. Why does the helper handle status `204` before calling `response.json()`?

# 5. The Vite development proxy

Open `client/vite.config.js`.

```js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:3001" }
  }
});
```

The browser opens the UI from port 5173. React uses relative paths such as `/api/auth/login`. Vite forwards those requests to Express on port 3001.

The proxy is development infrastructure, not an authentication or authorization control. In production, the demo can serve the built React application from Express.

# 6. Express session and cookie configuration

Open `server/src/app.js` and find `app.use(session(...))`.

```js
app.use(session({
  name: production ? "__Host-cinema-session" : "cinema-session",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: production,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 4,
    path: "/"
  }
}));
```

`express-session` adds `req.session` to requests. When a request includes a valid session cookie, the middleware uses its identifier to find the corresponding server-side session.

The cookie contains an opaque session identifier and its signature. It does not contain the password, password hash, complete user object, or application data. The authenticated user is stored in the server-side session as `req.session.user`.

## Important options

| Option | Purpose |
|---|---|
| `httpOnly: true` | Prevents JavaScript from reading the cookie value |
| `secure: production` | Sends the production cookie only over HTTPS |
| `sameSite: "lax"` | Restricts cross-site cookie sending and helps reduce CSRF risk |
| `maxAge` | Sets a four-hour cookie lifetime |
| `path: "/"` | Makes the cookie available to the whole application |
| `saveUninitialized: false` | Avoids creating an empty session for every visitor |
| `resave: false` | Avoids saving an unchanged session on every request |

## When is the cookie created?

Opening the page does not necessarily create a session because `saveUninitialized` is false.

A session is created when application code writes state to `req.session`, for example:

- `req.session.guestId = crypto.randomUUID()` during guest checkout
- `req.session.user = publicUser(user)` after successful login

The route does not manually construct a cookie. `express-session` notices that session state was created or changed and adds a `Set-Cookie` header to the response. The browser processes that header and creates the cookie record.

## Development and production differ

Local development uses HTTP:

```text
Name: cinema-session
HttpOnly: yes
SameSite: Lax
Secure: no
```

Production uses HTTPS:

```text
Name: __Host-cinema-session
HttpOnly: yes
SameSite: Lax
Secure: yes
Path: /
Domain: not set
```

The `__Host-` prefix requires a Secure cookie, path `/`, and no Domain attribute. It gives the browser stronger rules for accepting the cookie.

The demo demonstrates a production-appropriate session pattern, but it is not a production-ready cinema system. Its default in-memory session store must be replaced with a production store such as Redis or another shared, managed store.

## Check your understanding

1. Is the user role stored in the cookie or in the server-side session?
2. Which response header asks the browser to store a cookie?
3. Why cannot the local HTTP demo use a Secure cookie?
4. What causes an anonymous guest session to be created?

# 7. Session secrets and startup configuration

Open `server/src/server.js` and `.env.example`.

```js
const production = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET
  ?? "development-only-secret-change-me";

if (production && sessionSecret === "development-only-secret-change-me") {
  throw new Error("SESSION_SECRET must be configured in production.");
}
```

The session secret signs the session cookie so that the server can detect tampering. It is a deployment secret and must not be committed to a public repository.

The application refuses to start in production with the known development default. This is a fail-fast check: it prevents an insecure configuration from being used silently.

When `production` is true, the application also enables `trust proxy`. This matters when HTTPS terminates at a trusted reverse proxy. The exact setting must match the real deployment infrastructure.

# 8. Users, bcrypt, and public data

Open `server/src/data.js`.

The demo stores a pre-generated bcrypt password hash:

```js
const passwordHash = "$2b$10$zNzxXdpoEVZUqsVug3d50e4erjF2O9L.gkHYPT/8T4KqcxXlYKZTy";
```

The application does not decrypt this value. bcrypt is a slow, salted password-hashing method. `bcrypt.compare()` processes the submitted password using the parameters and salt embedded in the stored hash and checks whether the result matches.

The classroom accounts share one password for convenience. A real application stores a different hash for every user in a database.

Notice the output-boundary function:

```js
export function publicUser(user) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
```

Object destructuring removes `passwordHash`. The safe object may be placed in the session and returned to React without exposing the password hash.

## Check your understanding

1. Is a bcrypt password hash encrypted password text?
2. Why should the API not return a password hash even though it is not the plaintext password?
3. Which fields remain in the result of `publicUser()`?

# 9. The login route, step by step

Open `server/src/app.js` and find `POST /api/auth/login`.

## Step 1: rate limiting

```js
const loginLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});
```

The classroom configuration permits ten attempts per minute from one source. This slows simple guessing, but rate limiting alone is not a complete account-protection system.

## Step 2: normalize input

```js
const email = String(req.body.email ?? "").trim().toLowerCase();
const password = String(req.body.password ?? "");
```

The email address is trimmed and converted to lowercase. The password is not trimmed because spaces can be intentional password characters.

## Step 3: find the user and verify the password

```js
const user = users.find((candidate) => candidate.email === email);
const passwordMatches = user
  && await bcrypt.compare(password, user.passwordHash);

if (!passwordMatches) {
  return res.status(401).json({
    message: "Incorrect email or password."
  });
}
```

The route returns the same generic message for an unknown email and an incorrect password. This reduces unnecessary account enumeration.

## Step 4: regenerate the session

```js
req.session.regenerate((error) => {
  if (error) return next(error);
  req.session.user = publicUser(user);
  res.json({ user: req.session.user });
});
```

Successful authentication changes the trust level from anonymous to authenticated. The server discards the old session and creates a new session with a new identifier before storing the authenticated user.

This protects against session fixation. In a fixation attack, an attacker tries to make a victim use a session identifier already known to the attacker. The attacker hopes that the same identifier becomes authenticated when the victim logs in. Regenerating the session identifier breaks that connection.

After the route stores `req.session.user`, `express-session` adds the required `Set-Cookie` response header. The JSON body contains only the safe public user object. It does not contain the session identifier.

## Observe it in the browser

1. Clear the site's cookies or open a private window.
2. Sign in as the customer.
3. Open the login request in the Network panel.
4. Inspect the request JSON containing email and password.
5. Inspect the response JSON containing the public user.
6. Find the `Set-Cookie` response header.
7. Open Storage or Application and inspect `cinema-session`.

## Check your understanding

1. Why is `req.session.user` assigned only after `bcrypt.compare()` succeeds?
2. Why is the session identifier regenerated during login?
3. Does React create the session cookie?
4. Why does the response use one generic login error?

# 10. Restoring the public user after page refresh

Open the `/api/auth/me` route in `server/src/app.js`:

```js
app.get("/api/auth/me", (req, res) => {
  res.json({ user: req.session.user ?? null });
});
```

Then open the startup effect in `client/src/main.jsx`:

```js
useEffect(() => {
  Promise.all([api("/api/auth/me"), api("/api/screenings")])
    .then(([auth, shows]) => {
      setUser(auth.user);
      setScreenings(shows);
    });
}, []);
```

Refreshing a page clears React's in-memory state, but it does not necessarily end the server session. The browser still has the cookie. React asks the server for the current public user, and the server answers from session state.

React does not infer authentication from the presence of a cookie. It cannot read the HTTP-only value, and a cookie by itself could also represent an anonymous guest session.

# 11. Role-aware React is not authorization

Open `client/src/main.jsx` and find `Your role-aware workspace`.

The UI displays actions according to the public role:

- customer: My purchases
- cashier: My purchases and Cashier sales
- owner: all three actions

This conditional rendering gives users a relevant interface. It is not a security boundary. A user can call an API with developer tools, another program, or a manually constructed request even when no button is visible.

The Teaching lab intentionally exposes buttons for all protected routes. It demonstrates that the API must independently return `401`, `403`, or `200`.

## Experiment

1. Sign in as the customer.
2. Observe that the normal workspace hides cashier and owner actions.
3. Use the Teaching lab to call `/api/owner/report` anyway.
4. Confirm that Express returns `403`.

If removing a React condition would reveal protected data, the API is not correctly protected.

# 12. Authentication middleware

Open `server/src/auth.js`.

```js
export function requireAuthentication(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Please sign in first." });
  }
  next();
}
```

Middleware runs before the final route handler. `express-session` has already built `req.session`.

If no authenticated user exists, the middleware ends the request with `401`. The `return` is important because rejected execution must not fall through to protected code.

If a user exists, `next()` transfers control to the next middleware or route handler.

The middleware is attached to a route like this:

```js
app.get("/api/my-purchases", requireAuthentication, (req, res) => {
  // This code runs only for an authenticated user.
});
```

# 13. Role-authorization middleware

Continue in `server/src/auth.js`.

```js
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Please sign in first." });
    }
    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).json({
        message: "You are not allowed to perform this action."
      });
    }
    next();
  };
}
```

`requireRole` is a middleware factory. A route supplies the allowed roles, and the function returns the actual Express middleware.

```js
app.get(
  "/api/cashier/sales",
  requireRole("cashier", "owner"),
  handler
);

app.get(
  "/api/owner/report",
  requireRole("owner"),
  handler
);
```

The outcomes are:

| Situation | Result |
|---|---|
| No authenticated user | `401 Unauthorized` |
| Authenticated but role not allowed | `403 Forbidden` |
| Authenticated and role allowed | Request continues, normally producing `200 OK` |

## Check your understanding

1. Why does `requireRole` return another function?
2. What does `...allowedRoles` collect?
3. Why is the missing-user check performed before the role check?
4. What would happen if a protected route forgot to attach its middleware?

# 14. Ownership is more specific than role

Open `/api/my-purchases` in `server/src/app.js`.

```js
app.get("/api/my-purchases", requireAuthentication, (req, res) => {
  res.json(
    purchases
      .filter((purchase) => purchase.userId === req.session.user.id)
      .map(publicPurchase)
  );
});
```

Authentication proves that the request belongs to an account. The route then applies an ownership rule: only records whose `userId` equals the trusted session user's ID are returned.

The browser does not choose the user ID for this query. Accepting an arbitrary user ID from a URL or request body without verifying ownership could expose another customer's data. This class of problem is often called IDOR or broken object-level authorization.

Role and ownership answer different questions:

- role: may this kind of user use this operation?
- ownership: may this specific user access this specific record?

# 15. Guest checkout and authenticated checkout

Open `POST /api/purchases` in `server/src/app.js`.

The route supports two purchase paths. If the session has no authenticated user, it validates a guest email and creates a random guest identifier when needed:

```js
if (!req.session.user && !req.session.guestId) {
  req.session.guestId = crypto.randomUUID();
}
```

Writing `guestId` to the session causes an anonymous session and cookie to be created.

The purchase owner is derived from trusted server session state:

```js
userId: req.session.user?.id ?? null,
guestId: req.session.user ? null : req.session.guestId
```

An authenticated purchase receives the account's user ID. A guest purchase receives an internal guest ID. `publicPurchase()` removes the internal `guestId` before sending the purchase to the browser.

An anonymous session identifies a browser-side checkout process. It does not prove a person's identity. Therefore, a guest still receives `401` from `/api/my-purchases`.

## Experiment

1. Start without signing in.
2. Make a guest purchase.
3. Confirm that the browser now has `cinema-session`.
4. Call `/api/my-purchases` from the Teaching lab.
5. Confirm that the result is still `401`.
6. Sign in and make another purchase.
7. Call My purchases and inspect `checkoutType: "account"`.

# 16. Logout must invalidate the server session

Open the logout route in `server/src/app.js`.

```js
req.session.destroy((error) => {
  if (error) return next(error);
  res.clearCookie(cookieName, { path: "/" });
  res.status(204).end();
});
```

The server destroys the server-side session and instructs the browser to expire the cookie. Cookie removal must use a matching name and path.

The response is `204 No Content`, so the client helper returns `null` without trying to parse JSON.

React calls `setUser(null)` only after the server confirms logout. Clearing React state alone would merely hide the authenticated UI while leaving the real server session active.

# 17. Security tests

Open `server/test/auth.test.js` and run:

```powershell
npm test
```

Supertest sends requests directly to the Express application. `request.agent(app)` retains cookies across requests, similar to one browser session.

The tests prove that:

- an anonymous request receives `401`
- a customer receives `403` from the owner route
- an owner receives `200` from the owner route
- guest checkout creates an HttpOnly, SameSite cookie without authenticating the guest
- login failure uses one generic error
- a cashier can access sales but not the owner report
- logout invalidates the authenticated session

Security testing must include denied cases. Testing only a successful owner request would not prove that customers are blocked.

## Read one test as a story

```js
const agent = request.agent(app);

await agent
  .post("/api/auth/login")
  .send({ email: "customer@cinema.test", password: "demo1234" })
  .expect(200);

await agent
  .get("/api/owner/report")
  .expect(403);
```

The first request authenticates the agent and stores its session cookie. The second request automatically reuses that cookie. The server recognizes the customer but denies the owner operation.

# 18. Guided source-code tour

Use this sequence when revising the project:

## Part A: session configuration

1. Open `server/src/app.js`.
2. Find `app.use(session`.
3. Identify the cookie name, lifetime, and security attributes.
4. Explain what is stored in the cookie and what remains on the server.

## Part B: login

1. Find `/api/auth/login`.
2. Identify input normalization.
3. Find `bcrypt.compare`.
4. Find the generic failure response.
5. Find `req.session.regenerate`.
6. Find the assignment to `req.session.user`.
7. Open `publicUser` and identify the removed field.

## Part C: browser behavior

1. Open `client/src/api.js`.
2. Find the credentials setting.
3. Confirm that React never reads the session identifier.
4. Open `/api/auth/me` and explain page-refresh recovery.

## Part D: authorization

1. Open `server/src/auth.js`.
2. Identify the branches producing `401`, `403`, and `next()`.
3. Find routes using `requireRole`.
4. Compare server middleware with React's conditional buttons.

## Part E: ownership and tests

1. Find the ownership filter in `/api/my-purchases`.
2. Explain why its user ID comes from the session.
3. Find `request.agent(app)` in the tests.
4. Run the test suite and identify the denied cases.

# 19. Common questions

## Where exactly is the cookie created?

Application code writes data to `req.session`. `express-session` creates or updates the server session and adds `Set-Cookie` to the response. The browser processes the header and stores the cookie.

## Why is the session ID absent from React?

The HTTP-only cookie is intentionally managed by the browser. The browser attaches it automatically. React only needs the public user object.

## Is the cookie encrypted?

The session identifier is signed so the server can detect tampering. The application user data is not placed in the cookie; it remains in the server-side session.

## Does receiving a cookie mean the user is authenticated?

No. Guest checkout also uses a session cookie. Authentication is represented by a verified user stored as `req.session.user`.

## Can a user modify `user.role` in React?

Users can change client-side state in their own browser or construct requests manually. That may change the displayed interface, but it does not change the role stored in the server session. Express still performs the real check.

## Why store the role in the session?

It keeps the classroom implementation simple. A production design must decide how quickly role changes take effect. It may invalidate sessions or re-read critical authorization data from a database.

## Why is MemoryStore unsuitable for production?

It is not designed for production load, loses sessions when the process restarts, and cannot share sessions reliably across multiple application instances. Production requires a shared, managed session store.

## Is SameSite=Lax complete CSRF protection?

No. It reduces risk, but the application must evaluate its request methods, origin structure, and threat model. Sensitive operations may also need CSRF tokens or Origin checks.

## Is an HTTP-only cookie enough to solve XSS?

No. HttpOnly prevents direct JavaScript reading of the cookie value. Injected scripts may still perform actions as the current user from inside the browser. Preventing and limiting XSS remains necessary.

# 20. What the classroom demo intentionally simplifies

Do not copy the demo unchanged into production. It intentionally omits or simplifies:

- a real database for users, screenings, purchases, and seat inventory
- a production session store
- complete schema-based input validation
- registration, password change, and account recovery
- multi-factor authentication or passkeys
- concurrent seat holds and database transactions
- a payment provider, signed webhooks, and idempotency
- a threat-model-specific CSRF design
- comprehensive audit logs, monitoring, and alerts
- production secrets management and deployment infrastructure

The demo shows a production-appropriate authentication and authorization pattern. It is not a complete production cinema platform.

# 21. Final self-check

Answer these questions without looking at the guide:

1. Who creates the `Set-Cookie` response header, and who stores the cookie?
2. Why does React not read the session identifier?
3. What operation creates an anonymous guest session?
4. How is `req.session.user` created?
5. What attack does session regeneration help prevent?
6. Why is `/api/auth/me` useful after a page refresh?
7. What is the difference between a React role condition and `requireRole`?
8. Why is a customer role not sufficient to protect individual purchases?
9. Why does clearing React state not complete logout?
10. How does a Supertest agent model a browser session?
11. What is the difference between `401` and `403` in this application?
12. Which demo components must be replaced before production deployment?

## One-minute summary

React sends login credentials to Express. Express compares the password with a bcrypt hash, regenerates the session, and stores a safe user object in the server-side session. `express-session` sends the browser an HTTP-only cookie containing an opaque session identifier. The browser automatically attaches the cookie to later requests. Express resolves the session, and middleware checks authentication, role, and resource ownership where necessary. React guides the interface, but the server makes the authorization decision.
