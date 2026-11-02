import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./api.js";
import "./styles.css";

const demoAccounts = [
  ["Customer", "customer@cinema.test"],
  ["Cashier", "cashier@cinema.test"],
  ["Owner", "owner@cinema.test"]
];

function App() {
  const [user, setUser] = useState(null);
  const [screenings, setScreenings] = useState([]);
  const [email, setEmail] = useState("customer@cinema.test");
  const [password, setPassword] = useState("demo1234");
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([api("/api/auth/me"), api("/api/screenings")])
      .then(([auth, shows]) => { setUser(auth.user); setScreenings(shows); })
      .catch((error) => setMessage(error.message));
  }, []);

  async function login(event) {
    event.preventDefault();
    try {
      // STEP 1 — Send the entered credentials to Express in the request body.
      const result = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      // STEP 5 — React receives the public user, never the HttpOnly cookie value.
      setUser(result.user);
      setMessage(`Welcome, ${result.user.name}!`);
    } catch (error) { setMessage(`${error.status ?? "Error"} — ${error.message}`); }
  }

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
      setUser(null);
      setMessage("204 — You signed out and the server session was destroyed.");
    } catch (error) { setMessage(`${error.status ?? "Error"} — ${error.message}`); }
  }

  async function buy(screeningId) {
    try {
      // STEP 6 — This demo selects a screening but hard-codes seat C7; it has no seat-picker UI.
      // STEP 7 — Send the purchase request; the browser attaches the matching cookie itself.
      const result = await api("/api/purchases", {
        method: "POST",
        body: JSON.stringify({ screeningId, seats: ["C7"], guestEmail: "guest@example.com" })
      });
      // STEP 10 — Show the server's purchase response in the interface.
      setMessage(`Booking ${result.id.slice(0, 8)} was created ${user ? "for your account" : "as a guest purchase"}.`);
    } catch (error) { setMessage(`${error.status ?? "Error"} — ${error.message}`); }
  }

  async function tryProtected(path) {
    try { setMessage(`200 — ${JSON.stringify(await api(path))}`); }
    catch (error) { setMessage(`${error.status ?? "Error"} — ${error.message}`); }
  }

  return <main>
    <header>
      <div><span className="eyebrow">AUTHENTICATION DEMO</span><h1>Aurora Cinema</h1></div>
      {user ? <div className="identity"><span>{user.name}<small>{user.role}</small></span><button onClick={logout}>Sign out</button></div> : <span>Guest</span>}
    </header>
    {message && <div className="message" role="status">{message}</div>}
    {!user && <section className="panel login">
      <div><h2>Sign in or continue as a guest</h2><p>Every demo account uses <code>demo1234</code>.</p></div>
      <form onSubmit={login}>
        <label>Email<select value={email} onChange={(event) => setEmail(event.target.value)}>{demoAccounts.map(([label, value]) => <option key={value} value={value}>{label}: {value}</option>)}</select></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button type="submit">Sign in</button>
      </form>
    </section>}
    <section><h2>Screenings</h2><div className="grid">{screenings.map((show) => <article key={show.id} className="card"><span>Auditorium {show.auditorium}</span><h3>{show.movie}</h3><p>{new Date(show.startsAt).toLocaleString("en-GB")}</p><p>{show.availableSeats} seats available</p><button onClick={() => buy(show.id)}>Book seat C7 {user ? "to my account" : "as a guest"}</button></article>)}</div></section>
    <section className="panel"><h2>Your role-aware workspace</h2><p>This is normal application navigation. React shows only controls relevant to the current role.</p>{!user ? <p>Sign in to see account tools.</p> : <div className="actions"><button onClick={() => tryProtected("/api/my-purchases")}>My purchases</button>{["cashier", "owner"].includes(user.role) && <button onClick={() => tryProtected("/api/cashier/sales")}>Cashier sales</button>}{user.role === "owner" && <button onClick={() => tryProtected("/api/owner/report")}>Owner report</button>}</div>}</section>
    <section className="panel lab"><span className="eyebrow">TEACHING LAB</span><h2>Call protected APIs directly</h2><p>These buttons intentionally ignore UI visibility. They demonstrate that the server—not React—must return <code>401</code>, <code>403</code>, or <code>200</code>.</p><div className="actions"><button onClick={() => tryProtected("/api/my-purchases")}>GET /api/my-purchases</button><button onClick={() => tryProtected("/api/cashier/sales")}>GET /api/cashier/sales</button><button onClick={() => tryProtected("/api/owner/report")}>GET /api/owner/report</button></div></section>
  </main>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
