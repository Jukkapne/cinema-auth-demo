import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import express from "express";
import rateLimit from "express-rate-limit";
import session from "express-session";
import helmet from "helmet";
import { requireAuthentication, requireRole } from "./auth.js";
import { publicUser, purchases, screenings, users } from "./data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");

function publicPurchase(purchase) {
  const { guestId: _guestId, ...safePurchase } = purchase;
  return { ...safePurchase, checkoutType: purchase.userId ? "account" : "guest" };
}

export function createApp({ sessionSecret = "development-only-secret-change-me", production = false } = {}) {
  const app = express();
  if (production) app.set("trust proxy", 1);

  app.use(helmet({ contentSecurityPolicy: production ? undefined : false }));

  app.use(express.json());
  // STEP 4 — express-session sends Set-Cookie after session state is saved; the browser stores it.
  // STEP 8 — On later requests this middleware verifies the cookie and loads the server session.
  // These operations happen inside express-session, not in our route handlers.
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
    // The demo uses the default MemoryStore. Use Redis or a database-backed store in production.
  }));

  app.get("/api/screenings", (_req, res) => res.json(screenings));

  const loginLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });

  app.post("/api/auth/login", loginLimiter, async (req, res, next) => {
    try {
      const email = String(req.body.email ?? "").trim().toLowerCase();
      const password = String(req.body.password ?? "");
      // STEP 2 — Find the user and compare the submitted password with the stored bcrypt hash.
      const user = users.find((candidate) => candidate.email === email);
      const passwordMatches = user && await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatches) return res.status(401).json({ message: "Incorrect email or password." });

      // STEP 3 — Regenerate the session after login and store the authenticated public user.
      req.session.regenerate((error) => {
        if (error) return next(error);
        req.session.user = publicUser(user);
        // STEP 5 — Return public user data; the session identifier travels separately as a cookie.
        res.json({ user: req.session.user });
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/me", (req, res) => {
    res.json({ user: req.session.user ?? null });
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie(production ? "__Host-cinema-session" : "cinema-session", { path: "/" });
      res.status(204).end();
    });
  });

  app.get("/api/my-purchases", requireAuthentication, (req, res) => {
    res.json(purchases.filter((purchase) => purchase.userId === req.session.user.id).map(publicPurchase));
  });

  app.post("/api/purchases", (req, res) => {
    // STEP 9 — The visualization shows a protected booking route, but this demo also allows guests.
    // There is no role check here: the server uses session state to choose account or guest ownership.
    const screening = screenings.find((item) => item.id === Number(req.body.screeningId));
    const seats = Array.isArray(req.body.seats) ? req.body.seats.map(String) : [];
    if (!screening || seats.length === 0) {
      return res.status(400).json({ message: "Choose a screening and at least one seat." });
    }

    const guestEmail = req.session.user ? null : String(req.body.guestEmail ?? "").trim().toLowerCase();
    if (!req.session.user && !/^\S+@\S+\.\S+$/.test(guestEmail)) {
      return res.status(400).json({ message: "Enter a valid email address for guest checkout." });
    }
    if (!req.session.user && !req.session.guestId) req.session.guestId = crypto.randomUUID();

    const purchase = {
      id: crypto.randomUUID(),
      screeningId: screening.id,
      seats,
      userId: req.session.user?.id ?? null,
      guestId: req.session.user ? null : req.session.guestId,
      guestEmail,
      status: "demo-payment-pending"
    };
    // STEP 9 — Store in the in-memory array (not a database); no real payment is performed.
    purchases.push(purchase);
    // STEP 10 — Return 201 and the public purchase data to React.
    res.status(201).json(publicPurchase(purchase));
  });

  app.get("/api/cashier/sales", requireRole("cashier", "owner"), (_req, res) => {
    res.json({ salesCount: purchases.length, purchases: purchases.map(publicPurchase) });
  });

  app.get("/api/owner/report", requireRole("owner"), (_req, res) => {
    res.json({ title: "Owner report", ticketsSold: purchases.reduce((sum, item) => sum + item.seats.length, 0) });
  });

  if (production) {
    app.use(express.static(clientDist));
    app.get("/{*splat}", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
  }

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ message: "An unexpected server error occurred." });
  });
  return app;
}
