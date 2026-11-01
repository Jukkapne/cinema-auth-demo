# Teacher notes

## Before class

Run `npm install`, `npm test`, and `npm run dev`. Open the browser's Network and Application/Storage panels. Keep one private browsing window available to demonstrate a separate session.

## Suggested timing

| Time | Topic | Method |
|---:|---|---|
| 0–10 min | Cinema roles and guest checkout | Discussion |
| 10–25 min | Authentication, authorization, trust boundary | Slides and questions |
| 25–35 min | Cookie session flow | Diagram and browser tools |
| 35–43 min | JWT comparison | Compact explanation |
| 43–73 min | Live coding and attack attempts | Demo |
| 73–83 min | Payments and production caveats | Discussion |
| 83–90 min | Exit questions | Individual answers |

## Opening question

Ask: “A cashier button is hidden from customers. Is the cashier function protected?”

Do not answer immediately. Return to the question when calling the API directly during the demo.

## Vocabulary to keep consistent

- **authentication**: establishing who the user is
- **authorization**: deciding whether that user may perform an action
- **session**: server-recognized state spanning multiple HTTP requests
- **credential**: secret or proof used to authenticate
- **role**: coarse grouping of permissions
- **ownership check**: authorization against a specific resource

Avoid saying that `401` means “not authorized”; in teaching language, call it “not authenticated” even though the HTTP reason phrase is Unauthorized.

## JWT explanation script

“JWT is a signed container for claims. It is not automatically safer, and it is not the opposite of a cookie. We could put a JWT inside this same HTTP-only cookie. We choose a random session ID because one browser frontend and one backend do not need JWT's trade-offs. You may choose JWT in your project, but you own the storage, refresh, revocation, and stale-role questions.”

Draw these three alternatives:

```text
Browser -- opaque ID cookie --> Express -- session lookup --> state
Browser -- JWT bearer header -> API     -- signature check --> claims
Browser -- JWT cookie --------> API     -- signature check --> claims
```

Emphasize that signed is not encrypted. Do not decode a real user token on an untrusted website.

## Productive questions during the demo

- Can the customer change their role in React DevTools?
- If they can, what does that actually change?
- What should happen when no user is signed in?
- What should happen when a customer requests the owner route?
- Is a guest session an authenticated user?
- Where should the ticket price be calculated?
- How does the application know that payment truly succeeded?

## Expected misconceptions

**“CORS protects the API.”** CORS controls which browser pages may read cross-origin responses. It is not user authorization and does not stop non-browser clients.

**“HttpOnly prevents XSS.”** It prevents JavaScript from reading that cookie. XSS can still act through the victim's browser, so output handling and a strong Content Security Policy still matter.

**“JWT is stateless, so logout is automatic.”** A self-contained token normally remains valid until expiration unless a revocation or version check introduces server state.

**“The role is hidden, so users cannot change it.”** Client data is never an authorization authority.

**“Guest checkout needs no session.”** It may still need temporary server state for cart and seat holds; it simply lacks an authenticated account identity.

## Production boundary

Be explicit that MemoryStore and arrays are classroom scaffolding. They allow the process to be seen in one file but must not be copied into a deployed ticket shop.

## Exit questions and expected answers

1. Who performs the decisive role check? **Express/the server.**
2. Why can React not read the session cookie? **HttpOnly.**
3. What is the difference between `401` and `403`? **No authenticated identity versus known identity without permission.**
4. Is a JWT encrypted? **Not by default; a signed JWT payload is readable.**
5. Why choose an opaque session here? **Simpler revocation and current server-side state for a same-origin browser application.**
